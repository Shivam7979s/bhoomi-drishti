from fastapi import APIRouter
from app.db.session import get_db_pool
from app.embeddings.local_provider import local_embedding_provider
from app.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """Health check validating database connection and FastEmbed model readiness."""
    db_status = "UP"
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
    except Exception as e:
        db_status = f"DOWN: {e}"

    return {
        "status": "UP" if db_status == "UP" else "DEGRADED",
        "service": "bhoomi-drishti-ai",
        "database": db_status,
        "embedding_model": settings.embedding_model,
        "embedding_dimension": local_embedding_provider.get_dimension(),
    }
