"""Download only audited inference dependencies; retain revision and hash evidence."""
import hashlib
import json
from pathlib import Path
from huggingface_hub import snapshot_download
from check_licenses import check

check()
root = Path(__file__).resolve().parents[1]
lock = json.loads((root / "models.lock.json").read_text())
receipts = []
for model in lock["models"]:
    destination = root / "models" / model["destination"]
    snapshot_download(repo_id=model["id"], revision=model["revision"], local_dir=destination, allow_patterns=model["files"])
    files = {}
    for name in model["files"]:
        path = destination / name
        digest = hashlib.sha256()
        with path.open("rb") as source:
            for chunk in iter(lambda: source.read(1024 * 1024), b""): digest.update(chunk)
        files[name] = digest.hexdigest()
    receipts.append({"id": model["id"], "revision": model["revision"], "license": model["license"], "sha256": files})
(root / "models/download-receipts.json").write_text(json.dumps(receipts, indent=2))
