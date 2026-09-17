"""Resolve operator-installed avatar data without application dependencies."""
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def avatar_package(avatar_id, root=None):
    if not isinstance(avatar_id, str) or not re.fullmatch(r"[a-zA-Z0-9_-]{1,64}", avatar_id):
        raise ValueError("invalid_avatar_id")
    root = Path(root or os.getenv("AVATAR_PACKAGE_DIR", ROOT / "avatar_packages")).resolve()
    package = (root / avatar_id).resolve()
    if package.parent != root:
        raise ValueError("invalid_avatar_path")
    manifest = json.loads((package / "manifest.json").read_text())
    if manifest.get("id") != avatar_id:
        raise ValueError("avatar_manifest_id_mismatch")
    if (manifest.get("fps"), manifest.get("sample_rate"), manifest.get("audio_format")) != (25, 16000, "pcm_s16le"):
        raise ValueError("unsupported_avatar_format")
    return package


def configured_package():
    root = Path(os.getenv("AVATAR_PACKAGE_DIR", ROOT / "avatar_packages"))
    avatar_id = os.getenv("AVATAR_ID")
    if not avatar_id:
        packages = sorted(root.glob("*/manifest.json"))
        if len(packages) != 1:
            raise ValueError("Set AVATAR_ID when multiple or no packages are installed")
        avatar_id = packages[0].parent.name
    return avatar_package(avatar_id, root)
