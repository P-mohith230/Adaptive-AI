"""
AdaptiveAI — FastAPI Application Entry Point
================================================
Initializes the application, middleware, CORS, startup events,
and mounts the v1 API router.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.api.v1.router import router as v1_router
from app.core.logging import setup_logging, get_logger
from app.storage.sheet_manager import get_sheet_manager

logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle — startup and shutdown."""
    # ── Startup ──────────────────────────────────────
    setup_logging()
    logger.info("[STARTUP] AdaptiveAI starting up...")

    settings = get_settings()
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Storage backend: {settings.STORAGE_BACKEND}")
    logger.info(f"Mock AI mode: {settings.USE_MOCK_AI}")

    # Initialize sheet manager — creates all 8 master sheets
    sheet_manager = get_sheet_manager()
    health = await sheet_manager.health_check()
    logger.info(f"Sheet health check: {sum(1 for v in health.values() if v['status'] == 'healthy')}/{len(health)} healthy")

    # Run seeding only if explicitly enabled AND in development (never in production)
    if settings.SEED_ON_STARTUP and settings.ENVIRONMENT == "development":
        from app.seed import seed_data_if_empty
        await seed_data_if_empty()
        logger.info("Seed check completed")
    else:
        logger.info(f"Seeding disabled (SEED_ON_STARTUP={settings.SEED_ON_STARTUP}, ENV={settings.ENVIRONMENT})")

    logger.info("[OK] AdaptiveAI ready")

    yield

    # ── Shutdown ─────────────────────────────────────
    logger.info("AdaptiveAI shutting down...")


def create_app() -> FastAPI:
    """Application factory."""
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Adaptive AI-Native Operational Intelligence Platform",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # ── CORS ─────────────────────────────────────────
    raw_origins = settings.CORS_ORIGINS
    origins = []
    
    if isinstance(raw_origins, list):
        for origin in raw_origins:
            if isinstance(origin, str):
                origins.append(origin.strip())
    elif isinstance(raw_origins, str):
        raw_origins = raw_origins.strip()
        if raw_origins.startswith("[") and raw_origins.endswith("]"):
            try:
                import json
                parsed = json.loads(raw_origins)
                if isinstance(parsed, list):
                    origins.extend([str(o).strip() for o in parsed])
            except Exception:
                pass
        if not origins:
            origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
            
    # Always guarantee production and local development origins are included
    fallback_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "https://frontend-production-b552.up.railway.app"
    ]
    for fo in fallback_origins:
        if fo not in origins:
            origins.append(fo)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception Handler ────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled error: {exc}")
        from app.core.exceptions import AdaptiveAIError
        if isinstance(exc, AdaptiveAIError):
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
            )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    # ── Routes ───────────────────────────────────────
    app.include_router(v1_router)

    # ── Health Check ─────────────────────────────────
    @app.get("/health", tags=["System"])
    async def health():
        sheets = get_sheet_manager()
        report = await sheets.health_check()
        return {
            "status": "healthy",
            "version": settings.APP_VERSION,
            "storage": settings.STORAGE_BACKEND,
            "sheets": report,
        }

    return app


app = create_app()
