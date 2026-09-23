from typing import Optional
from fastembed import TextEmbedding
from app.embeddings.base import EmbeddingProvider
from app.config import settings


class LocalEmbeddingProvider(EmbeddingProvider):
    """
    Concrete local embedding provider using FastEmbed and BAAI/bge-small-en-v1.5.

    NOTE:
    BAAI/bge-small-en-v1.5 is the Phase 5 English embedding model. It outputs 384-dimensional
    unit-normalized vector embeddings optimized for semantic passage retrieval on standard CPUs
    via ONNX Runtime. Multilingual embedding support is explicitly deferred to future phases.
    """

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.embedding_model
        self.dimension = settings.embedding_dimension
        self._model: Optional[TextEmbedding] = None

    def _get_model(self) -> TextEmbedding:
        if self._model is None:
            # Lazy initialize FastEmbed model
            self._model = TextEmbedding(model_name=self.model_name)
        return self._model

    def get_dimension(self) -> int:
        return self.dimension

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        model = self._get_model()
        # FastEmbed returns a generator of numpy float arrays
        embeddings = list(model.embed(texts))
        return [vec.tolist() for vec in embeddings]

    def embed_query(self, query: str) -> list[float]:
        model = self._get_model()
        # BGE models use passage and query prefixes or standard query embedding
        query_embeddings = list(model.embed([query]))
        return query_embeddings[0].tolist()


# Global singleton instance for local embedding
local_embedding_provider = LocalEmbeddingProvider()
