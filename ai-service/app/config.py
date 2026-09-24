import os
from pathlib import Path
from typing import Optional
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

    # AI Synthesis Provider configuration (Phase 10.2)
    ai_synthesis_provider: str = os.getenv("AI_SYNTHESIS_PROVIDER", "extractive")
    ai_synthesis_base_url: str = os.getenv("AI_SYNTHESIS_BASE_URL", "http://localhost:11434/v1")
    ai_synthesis_model: str = os.getenv("AI_SYNTHESIS_MODEL", "llama3.2")
    ai_synthesis_api_key: Optional[str] = os.getenv("AI_SYNTHESIS_API_KEY", None)
    ai_synthesis_timeout_seconds: float = float(os.getenv("AI_SYNTHESIS_TIMEOUT_SECONDS", "25.0"))

    # Evidence Quality Gate thresholds (Provisional / configurable; not calibrated probabilities)
    evidence_gate_min_similarity: float = float(os.getenv("EVIDENCE_GATE_MIN_SIMILARITY", "0.35"))
    evidence_gate_sufficient_similarity: float = float(os.getenv("EVIDENCE_GATE_SUFFICIENT_SIMILARITY", "0.55"))

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
