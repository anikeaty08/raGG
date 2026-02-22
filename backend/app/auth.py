from fastapi import HTTPException, Header
from google.oauth2 import id_token
from google.auth.transport import requests
from typing import Optional
import os

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


def verify_google_token(token: str) -> dict:
    """
    Verify a Google ID token and return user info.
    """
    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        # Token is valid, return user info
        return {
            "user_id": idinfo["sub"],  # Google's unique user ID
            "email": idinfo.get("email", ""),
            "name": idinfo.get("name", ""),
            "picture": idinfo.get("picture", "")
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    Extract and verify the current user from the Authorization header.
    Returns user info or a default anonymous user.
    """
    if not authorization:
        # Allow anonymous users with a unique session-based ID
        return {"user_id": "anonymous", "email": "", "name": "Guest"}

    # Extract token from "Bearer <token>" format
    if authorization.startswith("Bearer "):
        token = authorization[7:]
    else:
        token = authorization

    # If no Google Client ID is set, use token as user_id directly (fallback)
    if not GOOGLE_CLIENT_ID:
        return {"user_id": token or "anonymous", "email": "", "name": "Guest"}

    return verify_google_token(token)


def get_user_id(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
) -> str:
    """
    Get user ID from either Google Auth token or X-User-ID header.
    Prioritizes Google Auth if available.
    """
    # If Authorization header with Bearer token exists, verify with Google
    if authorization and authorization.startswith("Bearer ") and GOOGLE_CLIENT_ID:
        try:
            user = verify_google_token(authorization[7:])
            return user["user_id"]
        except Exception:
            pass

    # Fall back to X-User-ID header (for non-authenticated users)
    if x_user_id:
        return x_user_id

    return "anonymous"
