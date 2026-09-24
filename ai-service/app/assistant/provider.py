import logging
from typing import Protocol, runtime_checkable
import httpx
from app.config import settings
from app.assistant.models import EvidenceChunk
from app.assistant.prompt import build_synthesis_prompt
from app.assistant.extractive import ExtractiveFallbackProvider

logger = logging.getLogger("bhoomi_drishti_ai.assistant")


class SynthesisProviderError(Exception):
    """Raised when an external synthesis provider fails or times out."""
    pass


@runtime_checkable
class SynthesisProvider(Protocol):
    """
    Abstract protocol for synthesis providers.
    All providers must accept a query and evidence, returning (answer, cited_indices, provider_name).
    """

    async def synthesize(
        self,
        query: str,
        evidence: list[EvidenceChunk],
    ) -> tuple[str, list[int], str]:
        ...


class OpenAICompatibleProvider:
    """
    Inference provider compatible with OpenAI-compatible REST endpoints,
    including local Ollama, vLLM, LM Studio, or hosted APIs.
    """

    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
        timeout_seconds: float | None = None,
    ):
        self.base_url = (base_url or settings.ai_synthesis_base_url).rstrip("/")
        self.model = model or settings.ai_synthesis_model
        self.api_key = api_key or settings.ai_synthesis_api_key
        self.timeout_seconds = timeout_seconds or settings.ai_synthesis_timeout_seconds

    async def synthesize(
        self,
        query: str,
        evidence: list[EvidenceChunk],
    ) -> tuple[str, list[int], str]:
        system_prompt, user_content = build_synthesis_prompt(query, evidence)

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.1,
        }

        endpoint = f"{self.base_url}/chat/completions"
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(endpoint, json=payload, headers=headers)
                if response.status_code != 200:
                    raise SynthesisProviderError(
                        f"Inference provider returned HTTP {response.status_code}: {response.text}"
                    )
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return content.strip(), [], f"openai_compatible ({self.model})"
        except httpx.TimeoutException as exc:
            logger.warning(f"Synthesis provider timed out after {self.timeout_seconds}s: {exc}")
            raise SynthesisProviderError(f"Synthesis provider timed out after {self.timeout_seconds}s") from exc
        except Exception as exc:
            logger.warning(f"Synthesis provider error: {exc}")
            raise SynthesisProviderError(f"Synthesis provider failed: {exc}") from exc


def get_synthesis_provider(force_extractive: bool = False) -> SynthesisProvider:
    """
    Factory to resolve the active SynthesisProvider based on server configuration.
    Defaults to deterministic ExtractiveFallbackProvider if extractive is specified or on fallback.
    """
    if force_extractive:
        return ExtractiveFallbackProvider()

    provider_name = settings.ai_synthesis_provider.lower().strip()
    if provider_name in ("openai", "ollama", "openai_compatible"):
        return OpenAICompatibleProvider()

    return ExtractiveFallbackProvider()
