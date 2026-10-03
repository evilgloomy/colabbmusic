import os
import jwt
from assets import avatar_package


def validate_token(token):
    secret = os.environ.get("AVATAR_JWT_SECRET", "")
    if len(secret) < 32:
        raise ValueError("signing_not_configured")
    claims = jwt.decode(token, secret, algorithms=["HS256"], audience=os.getenv("AVATAR_JWT_AUDIENCE", "shiba-avatar"), issuer=os.getenv("AVATAR_JWT_ISSUER", "shiba-live"),
                        options={"require": ["exp", "iat", "sub", "jti", "session_id", "avatar_id", "permissions"]})
    avatar_package(claims["avatar_id"])
    if not isinstance(claims["session_id"], str) or not 1 <= len(claims["session_id"]) <= 36 or claims["jti"] != claims["session_id"]:
        raise ValueError("invalid_scope")
    if not isinstance(claims["permissions"], list) or "avatar:render" not in claims["permissions"]:
        raise ValueError("insufficient_permissions")
    if not 0 < claims["exp"] - claims["iat"] <= 900:
        raise ValueError("invalid_lifetime")
    return claims
