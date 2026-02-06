"""
Test script - Run: python test_setup.py
"""
import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 50)
print("RAG Study Assistant - Setup Test")
print("=" * 50)

gemini_key = os.getenv("GEMINI_API_KEY", "")
qdrant_url = os.getenv("QDRANT_URL", "")
qdrant_key = os.getenv("QDRANT_API_KEY", "")

print(f"\n1. Environment Variables:")
print(f"   GEMINI_API_KEY: {'Set' if gemini_key else 'NOT SET!'}")
print(f"   QDRANT_URL: {qdrant_url[:50] if qdrant_url else 'NOT SET!'}")
print(f"   QDRANT_API_KEY: {'Set' if qdrant_key else 'NOT SET!'}")

print("\n2. Testing Gemini API (new google-genai package)...")
try:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=gemini_key)

    # Test embedding
    response = client.models.embed_content(
        model="text-embedding-004",
        contents="Hello world test",
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
    )
    print(f"   Embedding: SUCCESS (dim={len(response.embeddings[0].values)})")

    # Test generation
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents="Say hello in one word"
    )
    print(f"   Generation: SUCCESS ({response.text.strip()[:20]})")

except Exception as e:
    print(f"   FAILED: {e}")

print("\n3. Testing Qdrant Cloud...")
try:
    from qdrant_client import QdrantClient

    qclient = QdrantClient(url=qdrant_url, api_key=qdrant_key, timeout=30)
    collections = qclient.get_collections()
    print(f"   Connection: SUCCESS")
    print(f"   Collections: {[c.name for c in collections.collections]}")
except Exception as e:
    print(f"   FAILED: {e}")

print("\n" + "=" * 50)
print("If all tests pass, run: uvicorn app.main:app --reload")
print("=" * 50)
