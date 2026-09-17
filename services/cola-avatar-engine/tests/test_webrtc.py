"""Real CPU aiortc lifecycle test with synthetic frames; NOT a GPU/lip-sync test."""
import asyncio
import numpy as np
import pytest
from aiortc import RTCPeerConnection, RTCConfiguration
from media import Timeline, tracks


@pytest.mark.asyncio
async def test_real_peer_connection_receives_both_tracks_and_closes():
    sender = RTCPeerConnection(RTCConfiguration(iceServers=[]))
    receiver = RTCPeerConnection(RTCConfiguration(iceServers=[]))
    image = np.zeros((64, 64, 3), dtype=np.uint8)
    async def event(_): pass
    timeline = Timeline(lambda *args: image, event)
    received = set()
    readers = []
    @receiver.on("track")
    def on_track(track):
        async def consume():
            while True:
                await track.recv()
                received.add(track.kind)
        readers.append(asyncio.create_task(consume()))
    try:
        for track in tracks(timeline): sender.addTrack(track)
        await sender.setLocalDescription(await sender.createOffer())
        await receiver.setRemoteDescription(sender.localDescription)
        await receiver.setLocalDescription(await receiver.createAnswer())
        await sender.setRemoteDescription(receiver.localDescription)
        for _ in range(100):
            if received == {"audio", "video"}: break
            await asyncio.sleep(.05)
        assert received == {"audio", "video"}
    finally:
        for task in readers: task.cancel()
        await asyncio.gather(*readers, return_exceptions=True)
        await timeline.close()
        await sender.close(); await receiver.close()
    assert sender.connectionState == receiver.connectionState == "closed"
