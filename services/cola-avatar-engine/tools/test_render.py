"""Offline CUDA acceptance entry point. No server, credentials or network required."""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
import wave

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from assets import ROOT, avatar_package


def read_wav(path):
    """Accept the renderer's exact PCM contract; never silently change the voice."""
    with wave.open(str(path), "rb") as source:
        if (source.getnchannels(), source.getsampwidth(), source.getframerate(), source.getcomptype()) != (1, 2, 16000, "NONE"):
            raise ValueError("WAV must be uncompressed 16-bit mono PCM at 16000 Hz")
        count = source.getnframes()
        if not 0 < count <= 16000 * 45:
            raise ValueError("WAV must contain more than zero and at most 45 seconds of audio")
        pcm = source.readframes(count)
        if len(pcm) != count * 2:
            raise ValueError("Truncated WAV")
        return pcm


def render_file(renderer, pcm, audio, target, ffmpeg):
    """Encode generated frames plus the input voice; measure inference without mux time."""
    width, height = renderer.manifest["output_width"], renderer.manifest["output_height"]
    duration = len(pcm) / 32000
    command = [ffmpeg, "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
               "-f", "rawvideo", "-pixel_format", "bgr24", "-video_size", f"{width}x{height}",
               "-framerate", "25", "-i", "pipe:0", "-i", str(audio),
               "-map", "0:v:0", "-map", "1:a:0", "-c:v", "libx264", "-preset", "medium",
               "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
               "-t", str(duration), "-movflags", "+faststart", str(target)]
    frames, compute_seconds, first_frame_ms = 0, 0.0, None
    started = time.perf_counter()
    iterator = renderer.render(pcm, lambda: False)
    with tempfile.TemporaryFile() as errors:
        process = subprocess.Popen(command, stdin=subprocess.PIPE, stderr=errors)
        try:
            while True:
                before = time.perf_counter()
                item = next(iterator, None)
                compute_seconds += time.perf_counter() - before
                if item is None:
                    break
                frame, _, _ = item
                if frame.shape != (height, width, 3) or str(frame.dtype) != "uint8":
                    raise ValueError("Renderer returned an invalid BGR frame")
                if first_frame_ms is None:
                    first_frame_ms = (time.perf_counter() - started) * 1000
                process.stdin.write(frame.tobytes())
                frames += 1
            process.stdin.close()
            if process.wait() != 0:
                errors.seek(0)
                raise RuntimeError("FFmpeg failed: " + errors.read().decode(errors="replace")[-2000:])
            if frames != math.ceil(len(pcm) / 1280):
                raise RuntimeError("Incomplete render: unexpected frame count")
        except BaseException:
            process.kill()
            process.wait()
            raise
        finally:
            if not process.stdin.closed:
                process.stdin.close()
            iterator.close()
    total = time.perf_counter() - started
    return {"frames": frames, "audio_duration_seconds": duration,
            "render_seconds_excluding_encode": compute_seconds,
            "render_fps_excluding_encode": frames / compute_seconds,
            "mean_frame_ms_excluding_encode": compute_seconds * 1000 / frames,
            "first_frame_ms": first_frame_ms, "render_and_encode_seconds": total,
            "render_and_encode_fps": frames / total,
            "last_batch_model_frame_ms": renderer.frame_ms,
            "audio_encoding": "AAC from input WAV; original input PCM unchanged; AAC is lossy"}


def run(args):
    # Set before any ML import. Missing local weights fail rather than trigger downloads.
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    output = Path(args.output).resolve()
    audio = Path(args.audio).resolve()
    report_path = output.with_suffix(".metrics.json")
    if output.suffix.lower() != ".mp4":
        raise ValueError("Output must end in .mp4")
    if output.exists() or report_path.exists():
        raise ValueError("Output or metrics already exists; choose a new output name")
    output.parent.mkdir(parents=True, exist_ok=True)
    started = time.perf_counter()
    report = {"status": "failed", "avatar": args.avatar, "input_audio": str(audio),
              "output_path": None, "gpu": None, "cuda_version": None,
              "model_load_success": False, "model_load_seconds": None,
              "render_fps_excluding_encode": None, "peak_vram_allocated_mib": None,
              "render_and_encode_seconds": None,
              "visual_review": "not performed; human review of output required",
              "milestone_accepted": False}
    try:
        pcm = read_wav(audio)
        report["input_pcm_sha256"] = hashlib.sha256(pcm).hexdigest()
        package = avatar_package(args.avatar)
        geometry = json.loads((package / "cache/geometry.json").read_text())
        report["source_sha256"] = geometry["source_sha256"]
        ffmpeg = shutil.which("ffmpeg")
        if not ffmpeg:
            raise RuntimeError("FFmpeg executable required (included in the Docker image)")
        import torch
        report["cuda_version"] = torch.version.cuda
        if not torch.cuda.is_available():
            raise RuntimeError("CUDA unavailable; an NVIDIA GPU is required, no CPU/synthetic fallback")
        report["gpu"] = torch.cuda.get_device_name(0)
        report["torch_version"] = torch.__version__
        report["gpu_total_vram_mib"] = torch.cuda.get_device_properties(0).total_memory / 2**20
        torch.cuda.reset_peak_memory_stats()
        from renderer import MuseTalkRenderer
        before = time.perf_counter()
        renderer = MuseTalkRenderer(Path(args.models).resolve(), package)
        torch.cuda.synchronize()
        report["model_load_seconds"] = time.perf_counter() - before
        report["model_load_success"] = True
        with tempfile.TemporaryDirectory(prefix="avatar-render-", dir=output.parent) as temp:
            movie = Path(temp) / "render.mp4"
            # Snapshot exactly the validated samples, avoiding input changes during inference.
            wav = Path(temp) / "input.wav"
            with wave.open(str(wav), "wb") as source:
                source.setparams((1, 2, 16000, 0, "NONE", "not compressed"))
                source.writeframes(pcm)
            report.update(render_file(renderer, pcm, wav, movie, ffmpeg))
            torch.cuda.synchronize()
            report["peak_vram_allocated_mib"] = torch.cuda.max_memory_allocated() / 2**20
            report["peak_vram_reserved_mib"] = torch.cuda.max_memory_reserved() / 2**20
            # Hard link is atomic and refuses to replace an existing output.
            os.link(movie, output)
        report.update(status="rendered_pending_visual_review", output_path=str(output))
    except Exception as error:
        report["error"] = f"{type(error).__name__}: {error}"
    finally:
        report["total_seconds"] = time.perf_counter() - started
        with report_path.open("x") as destination:
            json.dump(report, destination, indent=2)
        print(json.dumps(report, indent=2))
        print(f"Metrics: {report_path}", file=sys.stderr)
    return 0 if report["output_path"] else 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--avatar", required=True)
    parser.add_argument("--audio", required=True, help="Real voice WAV, PCM16 mono 16 kHz, up to 45 seconds")
    parser.add_argument("--output", required=True)
    parser.add_argument("--models", default=str(ROOT / "models"))
    args = parser.parse_args()
    try:
        return run(args)
    except (ValueError, OSError) as error:
        print(str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
