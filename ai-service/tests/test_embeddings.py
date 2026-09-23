from app.embeddings.base import EmbeddingProvider
from app.embeddings.local_provider import LocalEmbeddingProvider


def test_local_embedding_provider_interface():
    provider = LocalEmbeddingProvider()
    assert isinstance(provider, EmbeddingProvider)
    assert provider.get_dimension() == 384


def test_embedding_dimension_mock():
    class MockEmbeddingProvider(EmbeddingProvider):
        def get_dimension(self) -> int:
            return 384

        def embed_texts(self, texts: list[str]) -> list[list[float]]:
            return [[0.1] * 384 for _ in texts]

        def embed_query(self, query: str) -> list[float]:
            return [0.1] * 384

    mock = MockEmbeddingProvider()
    assert mock.get_dimension() == 384
    res = mock.embed_texts(["sample passage"])
    assert len(res) == 1
    assert len(res[0]) == 384
    q_res = mock.embed_query("sample query")
    assert len(q_res) == 384
