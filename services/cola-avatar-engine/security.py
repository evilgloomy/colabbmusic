import os
import jwt


def validate_token(token):
    secret = os.environ.get("AVATAR_JWT_SECRET", "")
    if len(secret) < 32:
        raise ValueError("signing_not_configured")
    claims = jwt.decode(token, secret, algorithms=["HS256"], audience="shiba-avatar", issuer="shiba-live",
                        options={"require": ["exp", "iat", "sub", "jti", "session_id", "avatar_id", "live_session_id"]})
    if claims["avatar_id"] != "cola_b" or claims["jti"] != claims["session_id"]:
        raise ValueError("invalid_scope")
    if claims["exp"] - claims["iat"] > 900:
        raise ValueError("invalid_lifetime")
    return claims
