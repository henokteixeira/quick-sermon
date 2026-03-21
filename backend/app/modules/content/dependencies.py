from app.modules.content.services.ollama_client import OllamaClient


def get_ollama_client() -> OllamaClient:
    return OllamaClient()
