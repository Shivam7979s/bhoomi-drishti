import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database configuration
    database_host: str = os.getenv("DATABASE_HOST", "localhost")
    database_port: int = int(os.getenv("DATABASE_PORT", "5433"))
    database_name: str = os.getenv("DATABASE_NAME", "bhoomi_drishti")
    database_user: str = os.getenv("DATABASE_USER", "bhoomi")
    database_password: str = os.getenv("DATABASE_PASSWORD", "change_me")

    # Internal API Secret for Spring Boot <-> AI service communication
    ai_service_secret: str = os.getenv(
        "AI_SERVICE_SECRET", "dev_ai_internal_secret_bhoomi_drishti"
    )

    # Embedding model configuration (BAAI/bge-small-en-v1.5, 384 dimensions)
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
    embedding_dimension: int = 384

    # Server settings
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))

    # Security & processing limits
    max_document_size_bytes: int = 25 * 1024 * 1024  # 25 MB
    download_timeout_seconds: float = 15.0
    connect_timeout_seconds: float = 5.0
    max_redirects: int = 3

    # Local document directory for offline/prototype files
    data_documents_dir: str = os.getenv(
        "DATA_DOCUMENTS_DIR", str(Path(__file__).parents[2] / "data" / "documents")
    )

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def postgres_dsn(self) -> str:
        return (
            f"postgresql://{self.database_user}:{self.database_password}"
            f"@{self.database_host}:{self.database_port}/{self.database_name}"
        )


settings = Settings()
