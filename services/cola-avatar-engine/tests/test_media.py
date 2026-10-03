import asyncio
from fractions import Fraction
import numpy as np
import pytest
from media import Timeline, AVFrame, split_pcm, motion_index, tracks


def test_pcm_preserved_and_final_frame_padded():
    original = bytes(range(256)) * 7
    frames = list(split_pcm(original))
    assert b"".join(frames)[:len(original)] == original
    assert all(len(frame) == 1280 for frame in frames)
    assert b"".join(frames)[len(original):] == bytes(2560-len(original))
    with pytest.raises(ValueError): list(split_pcm(b"x"))


def test_motion_stays_in_source_range():
    for state in ("IDLE", "LISTENING", "THINKING", "SPEAKING"):
        assert all(0 <= motion_index(tick, 25, state, 10) < 25 for tick in range(10000))


@pytest.mark.asyncio
async def test_timestamp_authority_original_audio_and_cancel():
    events = []
    async def event(payload): events.append(payload)
    image = np.zeros((32, 32, 3), dtype=np.uint8)
    timeline = Timeline(lambda *args: image, event)
    audio, video = tracks(timeline)
    pcm = np.full(640, 1000, dtype="<i2").tobytes()
    await timeline.pending.put(AVFrame(image, pcm, "one", 0))
    a, v = await asyncio.gather(audio.recv(), video.recv())
    assert Fraction(a.pts, a.sample_rate) == v.pts * v.time_base == 0
    assert a.to_ndarray()[0].tolist() == [1000] * 320
    a2 = await audio.recv()
    assert a2.pts == 320
    assert a2.to_ndarray()[0].tolist() == [1000] * 320
    await timeline.pending.put(AVFrame(image, pcm, "one", 0))
    timeline.cancel()
    assert timeline.pending.empty() and timeline.audio.empty() and timeline.video.empty()
    a3, v2 = await asyncio.gather(audio.recv(), video.recv())
    assert a3.to_ndarray().sum() == 0
    assert Fraction(a3.pts, a3.sample_rate) == v2.pts * v2.time_base
    assert events[0] == {"type": "avatar.speaking.started", "id": "one"}
    await timeline.close(); audio.stop(); video.stop()
