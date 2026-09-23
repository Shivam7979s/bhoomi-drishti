from abc import ABC, abstractmethod


class EmbeddingProvider(ABC):
    """
    Abstract interface for generating vector embeddings from text chunks and search queries.
    Allows seamlessly changing or swapping embedding models in future phases.
    """

    @abstractmethod
    def get_dimension(self) -> int:
        """Returns the embedding vector dimension."""
        pass

    @abstractmethod
    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Generates unit-normalized vector embeddings for a batch of text passages."""
        pass

    @abstractmethod
    def embed_query(self, query: str) -> list[float]:
        """Generates a unit-normalized vector embedding for a search query."""
        pass
