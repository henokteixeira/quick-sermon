from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import AppException
from app.core.logging import setup_logging
from app.core.middleware import RequestIdMiddleware, app_exception_handler


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(debug=settings.DEBUG)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        debug=settings.DEBUG,
        lifespan=lifespan,
    )

    # Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestIdMiddleware)

    # Exception handlers
    app.add_exception_handler(AppException, app_exception_handler)

    # Routers
    from app.modules.analytics.routes import router as analytics_router
    from app.modules.auth.routes import router as auth_router
    from app.modules.clips.routes import router as clips_router
    from app.modules.health.routes import router as health_router
    from app.modules.users.routes import router as users_router
    from app.modules.videos.routes import router as videos_router
    from app.modules.youtube.routes import router as youtube_router

    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(videos_router)
    app.include_router(clips_router)
    app.include_router(youtube_router)
    app.include_router(analytics_router)

    return app
