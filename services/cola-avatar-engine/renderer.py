"""MuseTalk-specific implementation, isolated from signaling and media transport."""
import json
import time
from pathlib import Path
from media import motion_index, split_pcm


class MuseTalkRenderer:
    def __init__(self, models: Path, package: Path):
        import torch
        import cv2
        import numpy as np
        from transformers import WhisperModel
        from musetalk.models.vae import VAE
        from musetalk.models.unet import UNet, PositionalEncoding
        from musetalk.utils.audio_processor import AudioProcessor
        if not torch.cuda.is_available():
            raise RuntimeError("CUDA unavailable")
        self.torch, self.cv2, self.np = torch, cv2, np
        self.device = torch.device("cuda")
        self.vae = VAE(str(models / "sd-vae"), use_float16=True)
        self.unet = UNet(str(models / "musetalkV15/musetalk.json"), str(models / "musetalkV15/unet.pth"), use_float16=True, device=self.device)
        self.unet.model.eval()
        self.pe = PositionalEncoding().half().to(self.device)
        self.whisper = WhisperModel.from_pretrained(str(models / "whisper")).half().to(self.device).eval()
        self.audio = AudioProcessor(str(models / "whisper"))
        self.manifest = json.loads((package / "manifest.json").read_text())
        cache = package / "cache"
        self.frames = [cv2.imread(str(path)) for path in sorted((cache / "frames").glob("*.jpg"))]
        self.boxes = json.loads((cache / "geometry.json").read_text())["boxes"]
        self.mask = np.load(cache / "mask.npy", allow_pickle=False)
        self.latents = torch.load(cache / "latents.pt", map_location="cpu", weights_only=True)
        if not self.frames or len(self.frames) != len(self.boxes) or len(self.frames) != len(self.latents):
            raise RuntimeError("invalid avatar cache")
        self.frame_ms = None
        self.inference_fps = None
        self.gpu = torch.cuda.get_device_name(0)
        self.warm()

    def warm(self):
        torch = self.torch
        with torch.inference_mode():
            latent = self.latents[0].to(device=self.device, dtype=torch.float16)
            hidden = self.pe(torch.zeros((1, 50, 384), device=self.device, dtype=torch.float16))
            prediction = self.unet.model(latent, torch.tensor([0], device=self.device), encoder_hidden_states=hidden).sample
            self.vae.decode_latents(prediction)
        torch.cuda.synchronize()

    def idle(self, tick, state, energy):
        return self.frames[motion_index(tick, len(self.frames), state, energy)]

    def render(self, pcm, cancelled, energy=.5):
        """Yield batches off the event loop; generation checks discard cancelled CUDA work."""
        torch, np, cv2 = self.torch, self.np, self.cv2
        started = time.perf_counter()
        # Full short utterance feature extraction; PCM remains untouched in media.py.
        audio = np.frombuffer(pcm, dtype="<i2").astype(np.float32) / 32768
        padded = np.pad(audio, (0, max(0, 3200 - len(audio))))
        features = []
        for offset in range(0, len(padded), 480000):
            features.append(self.audio.feature_extractor(padded[offset:offset + 480000], return_tensors="pt", sampling_rate=16000).input_features.half())
        with torch.inference_mode():
            chunks = self.audio.get_whisper_chunk(features, self.device, torch.float16, self.whisper, len(padded), fps=25)
            samples = list(split_pcm(pcm))
            # Pad final fractional frame's conditioning, preserving the original PCM.
            if len(chunks) < len(samples): chunks = torch.cat([chunks, chunks[-1:]], dim=0)
            produced = 0
            for offset in range(0, len(samples), 4):
                if cancelled(): return
                count = min(4, len(samples) - offset)
                indices = [motion_index(offset + i, len(self.frames), "SPEAKING", energy) for i in range(count)]
                latents = torch.cat([self.latents[i] for i in indices]).to(device=self.device, dtype=torch.float16)
                t0 = time.perf_counter()
                prediction = self.unet.model(latents, torch.tensor([0], device=self.device), encoder_hidden_states=self.pe(chunks[offset:offset + count].to(self.device))).sample
                faces = self.vae.decode_latents(prediction)
                torch.cuda.synchronize()
                self.frame_ms = (time.perf_counter() - t0) * 1000 / count
                for i, (face, index) in enumerate(zip(faces, indices)):
                    if cancelled(): return
                    frame = self.frames[index].copy()
                    x1, y1, x2, y2 = self.boxes[index]
                    face = cv2.resize(face, (x2-x1, y2-y1))
                    mask = cv2.resize(self.mask, (x2-x1, y2-y1))[..., None]
                    frame[y1:y2, x1:x2] = (face * mask + frame[y1:y2, x1:x2] * (1-mask)).astype(np.uint8)
                    produced += 1
                    yield frame, samples[offset + i], produced == len(samples)
            self.inference_fps = produced / (time.perf_counter() - started)
