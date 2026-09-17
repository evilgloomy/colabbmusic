"""CPU input/packaging checks. These do not establish CUDA or visual acceptance."""
import json
from pathlib import Path
from types import SimpleNamespace
import wave
import pytest
from assets import avatar_package, configured_package
from tools.test_render import read_wav, run


def write_wav(path, channels=1, rate=16000, samples=b"\x01\x00" * 641):
    with wave.open(str(path), "wb") as wav:
        wav.setparams((channels, 2, rate, 0, "NONE", "not compressed"))
        wav.writeframes(samples)
    return samples


def test_wav_preserves_samples_and_fractional_frame(tmp_path):
    path = tmp_path / "voice.wav"
    expected = write_wav(path)
    assert read_wav(path) == expected


@pytest.mark.parametrize("options", [{"channels": 2}, {"rate": 24000}, {"samples": b""}, {"samples": bytes(16000 * 2 * 46)}])
def test_wav_rejects_unsupported_audio(tmp_path, options):
    path = tmp_path / "voice.wav"
    write_wav(path, **options)
    with pytest.raises(ValueError):
        read_wav(path)


def test_failed_render_reports_no_success_and_no_movie(tmp_path):
    output = tmp_path / "failed.mp4"
    args = SimpleNamespace(avatar="missing", audio=str(tmp_path / "missing.wav"), output=str(output), models="missing")
    assert run(args) == 1
    report = json.loads(output.with_suffix(".metrics.json").read_text())
    assert report["status"] == "failed"
    assert report["model_load_success"] is False
    assert report["milestone_accepted"] is False
    assert report["output_path"] is None
    assert not output.exists()
    with pytest.raises(ValueError, match="already exists"):
        run(args)


def test_generic_package_and_path_scope(tmp_path, monkeypatch):
    package = tmp_path / "another_character"
    package.mkdir()
    (package / "manifest.json").write_text(json.dumps({"id": package.name, "fps": 25, "sample_rate": 16000, "audio_format": "pcm_s16le"}))
    monkeypatch.setenv("AVATAR_PACKAGE_DIR", str(tmp_path))
    monkeypatch.delenv("AVATAR_ID", raising=False)
    assert configured_package() == package
    assert avatar_package("another_character") == package
    for value in ("../another_character", "/tmp/avatar", "missing", ""):
        with pytest.raises((ValueError, FileNotFoundError)):
            avatar_package(value)
    monkeypatch.setenv("AVATAR_ID", "missing")
    with pytest.raises(FileNotFoundError):
        configured_package()


def test_mp4_mux_preserves_frame_count_and_voice_duration(tmp_path):
    """Synthetic CPU fixture tests encoding only, never model/character acceptance."""
    import math
    import os
    import shutil
    import av
    import numpy as np
    from tools.test_render import render_file
    ffmpeg = os.getenv("FFMPEG_TEST_BIN") or shutil.which("ffmpeg")
    if not ffmpeg:
        pytest.skip("FFmpeg executable unavailable")
    count = 16481  # Fractional 25 fps frame, slightly over one second.
    pcm = (np.sin(np.arange(count) * 2 * np.pi * 440 / 16000) * 4000).astype("<i2").tobytes()
    audio = tmp_path / "fixture.wav"
    write_wav(audio, samples=pcm)

    class FixtureRenderer:
        manifest = {"output_width": 64, "output_height": 64}
        frame_ms = None

        def render(self, samples, cancelled):
            assert samples == pcm
            for index in range(math.ceil(count / 640)):
                yield np.full((64, 64, 3), index * 5, dtype=np.uint8), b"", False

    output = tmp_path / "fixture.mp4"
    result = render_file(FixtureRenderer(), pcm, audio, output, ffmpeg)
    with av.open(str(output)) as movie:
        assert len(movie.streams.audio) == len(movie.streams.video) == 1
        stream = movie.streams.audio[0]
        assert abs(float(stream.duration * stream.time_base) - count / 16000) < .005
        assert len(list(movie.decode(video=0))) == math.ceil(count / 640)
    with av.open(str(output)) as movie:
        decoded = np.concatenate([frame.to_ndarray().flatten() for frame in movie.decode(audio=0)])[:count]
        original = np.frombuffer(pcm, dtype="<i2") / 32768
        assert np.corrcoef(decoded, original)[0, 1] > .99
    assert result["frames"] == math.ceil(count / 640)
    assert result["render_fps_excluding_encode"] > 0
    assert read_wav(audio) == pcm
