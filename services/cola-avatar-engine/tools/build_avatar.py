"""Offline preprocessing of an approved 720p source clip; no runtime face detection."""
import argparse
import hashlib
import json
from pathlib import Path


def main():
    import cv2
    import numpy as np
    import torch
    from musetalk.models.vae import VAE
    parser = argparse.ArgumentParser()
    parser.add_argument("--character", choices=["cola_b"], default="cola_b")
    parser.add_argument("--source", required=True, help="Approved 1280x720, 25fps neutral motion clip")
    parser.add_argument("--crop", required=True, help="Face crop x1,y1,x2,y2; must remain aligned for entire clip")
    parser.add_argument("--models", default="models")
    args = parser.parse_args()
    box = [int(value) for value in args.crop.split(",")]
    if len(box) != 4 or not (0 <= box[0] < box[2] <= 1280 and 0 <= box[1] < box[3] <= 720):
        raise ValueError("Invalid crop")
    package = Path("avatar_packages") / args.character
    cache = package / "cache"
    if cache.exists(): raise ValueError("Cache already exists; move it aside before rebuilding")
    cap = cv2.VideoCapture(args.source)
    if abs(cap.get(cv2.CAP_PROP_FPS) - 25) > .1: raise ValueError("Source must be 25 fps")
    vae = VAE(str(Path(args.models) / "sd-vae"), use_float16=True)
    frames, latents, colors = [], [], []
    x1, y1, x2, y2 = box
    with torch.inference_mode():
        while len(frames) < 100:
            ok, frame = cap.read()
            if not ok: break
            if frame.shape[:2] != (720, 1280): raise ValueError("Source must be 1280x720")
            crop = cv2.resize(frame[y1:y2, x1:x2], (256, 256))
            latents.append(vae.get_latents_for_unet(crop).cpu())
            colors.append(crop.mean(axis=(0, 1)).tolist())
            frames.append(frame)
    cap.release()
    if len(frames) < 25: raise ValueError("At least one second of approved motion required")
    (cache / "frames").mkdir(parents=True)
    for i, frame in enumerate(frames): cv2.imwrite(str(cache / "frames" / f"{i:04}.jpg"), frame)
    mask = np.zeros((256, 256), dtype=np.float32)
    cv2.ellipse(mask, (128, 170), (105, 75), 0, 0, 360, 1, -1)
    mask = cv2.GaussianBlur(mask, (31, 31), 0)
    np.save(cache / "mask.npy", mask)
    torch.save(latents, cache / "latents.pt")
    (cache / "geometry.json").write_text(json.dumps({"boxes": [box] * len(frames),
        "landmarks": {"method": "operator-reviewed crop; no landmark model", "crop_center": [(x1+x2)/2, (y1+y2)/2]},
        "colour_profile_bgr": colors, "motion": {"source_frames": len(frames), "playback": "ping-pong", "max_speed": 1.1},
        "source_sha256": hashlib.sha256(Path(args.source).read_bytes()).hexdigest()}))
    print(f"Cached {len(frames)} frames. Review crop alignment, blink continuity and mouth seams before deployment.")


if __name__ == "__main__": main()
