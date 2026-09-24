from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from app.config import settings
from app.db.session import init_db_pool, close_db_pool
from app.embeddings.local_provider import local_embedding_provider
from app.api import health, ingestion, retrieval, assistant

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("bhoomi_drishti_ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager: initializes DB connection pool and pre-warms FastEmbed model."""
    logger.info("Initializing BHOOMI-DRISHTI AI Service...")
    try:
        await init_db_pool()
        logger.info("PostgreSQL connection pool initialized successfully.")
    except Exception as e:
        logger.warning(f"Could not connect to PostgreSQL on startup (will retry on demand): {e}")

    try:
        # Pre-warm FastEmbed model to eliminate cold-start latency on first query
        local_embedding_provider._get_model()
        logger.info(f"Loaded FastEmbed model: {settings.embedding_model}")
    except Exception as e:
        logger.warning(f"FastEmbed model pre-warm skipped or deferred: {e}")

    yield

    logger.info("Shutting down AI Service...")
    await close_db_pool()


app = FastAPI(
    title="BHOOMI-DRISHTI AI Knowledge & Evidence Service",
    description="Internal evidence extraction, chunking, embedding, and semantic vector retrieval service.",
    version="0.1.0",
    lifespan=lifespan,
)


@app.middleware("http")
async def verify_internal_secret_middleware(request: Request, call_next):
    """
    Guards all /internal/* endpoints: requires valid X-Internal-Secret header.
    Only Spring Boot (sharing the internal secret) can execute ingestion or retrieval.
    /health is exempted for container health probes.
    """
    path = request.url.path
    if path.startswith("/internal"):
        provided_secret = request.headers.get("X-Internal-Secret")
        if not provided_secret or provided_secret != settings.ai_service_secret:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "error": "FORBIDDEN",
                    "message": "Invalid or missing internal service secret.",
                },
            )

    return await call_next(request)


# Register routers
app.include_router(health.router)
app.include_router(ingestion.router)
app.include_router(retrieval.router)
app.include_router(assistant.router)
