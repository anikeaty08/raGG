from starlette.middleware.base import BaseHTTPMiddleware
import time


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start = time.time()
        response = await call_next(request)
        duration = (time.time() - start) * 1000
        try:
            path = request.url.path
        except Exception:
            path = "/"
        print(f"{request.method} {path} {response.status_code} {duration:.1f}ms")
        return response
