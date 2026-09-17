import time
import jwt
import pytest
from security import validate_token
from fastapi.testclient import TestClient
import server
SECRET = "test-signing-secret-with-more-than-32-bytes"


def token(**changes):
    claims = {"sub": "user", "jti": "session", "session_id": "session", "live_session_id": "live",
              "avatar_id": "cola_b", "iat": int(time.time()), "exp": int(time.time())+60,
              "aud": "shiba-avatar", "iss": "shiba-live"}
    claims.update(changes)
    return jwt.encode(claims, SECRET, algorithm="HS256")


@pytest.fixture(autouse=True)
def secret(monkeypatch): monkeypatch.setenv("AVATAR_JWT_SECRET", SECRET)


def test_scope_and_expiry():
    assert validate_token(token())["sub"] == "user"
    for changes in ({"exp": int(time.time())-1}, {"aud": "other"}, {"avatar_id": "other"}, {"jti": "other"}, {"exp": int(time.time())+1000}):
        with pytest.raises(Exception): validate_token(token(**changes))
    with pytest.raises(Exception): validate_token(token() + "tampered")


def test_unconfigured_secret_fails_closed(monkeypatch):
    monkeypatch.delenv("AVATAR_JWT_SECRET")
    with pytest.raises(ValueError): validate_token(token())


def test_health_does_not_claim_inference_and_offer_requires_auth():
    client = TestClient(server.app)
    assert client.get("/health").json()["model_loaded"] is False
    assert client.get("/health").json()["fps"] is None
    assert client.post("/offer", json={"session_id": "session", "sdp": "test", "type": "offer"}).status_code == 401
    assert client.post("/offer", headers={"Authorization": "Bearer " + token()}, json={"session_id": "other", "sdp": "test", "type": "offer"}).status_code == 403
    assert client.post("/offer", headers={"Authorization": "Bearer " + token()}, json={"session_id": "session", "sdp": "test", "type": "offer"}).status_code == 503


def test_websocket_rejects_untrusted_origin():
    client = TestClient(server.app)
    with pytest.raises(Exception):
        with client.websocket_connect("/control", headers={"Origin": "https://attacker.invalid"}): pass
