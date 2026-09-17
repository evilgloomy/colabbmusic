"""CI allowlist for audited code/weights, not a substitute for the linked license audit."""
import json
import re
from pathlib import Path


def check():
    root = Path(__file__).resolve().parents[1]
    lock = json.loads((root / "models.lock.json").read_text())
    assert re.fullmatch(r"[0-9a-f]{40}", lock["code"]["revision"])
    expected = {"TMElyralab/MuseTalk": "CreativeML-Open-RAIL-M", "stabilityai/sd-vae-ft-mse": "MIT", "openai/whisper-tiny": "Apache-2.0"}
    assert {model["id"] for model in lock["models"]} == set(expected)
    for model in lock["models"]:
        assert model["license"] == expected[model["id"]] and model["commercial"] is True
        assert re.fullmatch(r"[0-9a-f]{40}", model["revision"])
        assert not any("testdata" in filename for filename in model["files"])
    print("Pinned model/code license allowlist passed (no model weights executed).")


if __name__ == "__main__": check()
