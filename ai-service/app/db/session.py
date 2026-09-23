from typing import Optional
import asyncpg
from pgvector.asyncpg import register_vector
from app.config import settings

_pool: Optional[asyncpg.Pool] = None


async def init_db_pool() -> asyncpg.Pool:
    """Initializes asyncpg connection pool with pgvector codec registered."""
    global _pool
    if _pool is None:
        async def init_connection(conn: asyncpg.Connection):
            # Register pgvector vector type handler on every connection
            await register_vector(conn)

        _pool = await asyncpg.create_pool(
            host=settings.database_host,
            port=settings.database_port,
            database=settings.database_name,
            user=settings.database_user,
            password=settings.database_password,
            min_size=2,
            max_size=10,
            init=init_connection,
        )
    return _pool


async def get_db_pool() -> asyncpg.Pool:
    """Retrieves active asyncpg connection pool."""
    if _pool is None:
        return await init_db_pool()
    return _pool


async def close_db_pool():
    """Closes asyncpg connection pool on application shutdown."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
