# Commercial model audit — 17 September 2026

No weights or upstream sample media are committed. Download only the pinned allowlist in `models.lock.json`. The downloader saves model cards and SHA-256 receipts. A changed revision requires a fresh audit. This is an engineering license inventory, not a legal opinion.

| Component | Code license | Weight declaration | Decision |
| --- | --- | --- | --- |
| MuseTalk 1.5 UNet | MIT | Official Hugging Face card: **CreativeML Open RAIL-M**. Upstream GitHub also explicitly permits commercial model use. | Commercial use permitted subject to RAIL use/distribution restrictions. Preserve the more restrictive model declaration; do not describe weights as MIT. |
| sd-vae-ft-mse | Diffusers Apache-2.0; MuseTalk wrapper MIT | Official Stability AI model card: MIT | Allowed with attribution. |
| Whisper tiny | Original OpenAI Whisper code MIT; Transformers Apache-2.0 | Official OpenAI Hugging Face card: Apache-2.0 | Preserve Apache notices for this exact artifact. |

Primary sources inspected:

- [MuseTalk code license](https://github.com/TMElyralab/MuseTalk/blob/0a89dec45a0192b824e3cf4daf96c239440c5ed8/LICENSE) and [commercial-use statement](https://github.com/TMElyralab/MuseTalk/tree/0a89dec45a0192b824e3cf4daf96c239440c5ed8#disclaimerlicense).
- [MuseTalk weight card](https://huggingface.co/TMElyralab/MuseTalk/blob/3ef28bc5cff08c90ad8178a25f1b570cd800170f/README.md). Its YAML license declaration differs from the code license.
- [CreativeML Open RAIL-M terms](https://huggingface.co/spaces/CompVis/stable-diffusion-license/blob/main/license.txt): commercial use is allowed; use restrictions and downstream obligations still apply.
- [VAE weight card](https://huggingface.co/stabilityai/sd-vae-ft-mse/blob/31f26fdeee1355a5c34592e401dd41e45d25a493/README.md).
- [Whisper weight card](https://huggingface.co/openai/whisper-tiny/blob/169d4a4341b33bc18d8881c4b69c2e104e1cc0af/README.md), [original Whisper license](https://github.com/openai/whisper/blob/main/LICENSE).

## Excluded dependencies

DWPose, face-alignment, face-parsing/BiSeNet, ResNet face-parser weights, S3FD, SyncNet and MuseV are **not imported, downloaded or executed** by this service. No implicit model downloads for those components are allowed. Preprocessing takes an operator-reviewed crop from approved Cola media and stores geometric anchors, masks, color statistics and VAE latents. This avoids relying on unclear transitive checkpoint permissions.

Upstream internet test videos are expressly non-commercial research material and **must not be used for Cola or copied into the deployment**. Supply Shiba-owned/authorized Cola media. The Docker build removes upstream sample directories; deploy only necessary source and notices if redistributing the image.

## Notices and deployment

Retain the MuseTalk MIT LICENSE at `/opt/MuseTalk/LICENSE`, downloaded model cards, this inventory, model lock and receipts. Carry the full MIT, Apache-2.0 and CreativeML Open RAIL-M texts with any distributed worker/weight package. Do not use the renderer for prohibited RAIL uses. FFmpeg is a separate system dependency: the Ubuntu binary can carry GPL components; distribution must satisfy the exact installed build's license and source obligations. PyTorch (BSD-style), OpenCV (Apache-2.0), aiortc (BSD-3-Clause), FastAPI (MIT), PyAV (BSD-3-Clause), NumPy (BSD-3-Clause), Transformers/Diffusers (Apache-2.0) also retain their installed notices.

`python tools/check_licenses.py` checks the allowlist and immutable revisions. It does **not** claim a legal compliance certification, inspect downloaded tensors, or test GPU inference.
