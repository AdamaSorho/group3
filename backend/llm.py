import os
from langchain_community.chat_models import ChatOllama

def get_llm():
    """
    Initializes and returns the ChatOllama instance.
    """
    base_url = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    return ChatOllama(model="llama3.2", base_url=base_url, format="json")
