import pytest
from unittest.mock import Mock, AsyncMock, patch
from app.rag.query import RAGQueryEngine


@pytest.fixture
def mock_vector_store():
    """Create a mock vector store."""
    store = Mock()
    store.search = AsyncMock(return_value=[])
    return store


@pytest.fixture
def query_engine(mock_vector_store):
    """Create a query engine instance."""
    with patch('app.rag.query.gemini_client'), \
         patch('app.rag.query.groq_client'):
        engine = RAGQueryEngine(mock_vector_store)
        return engine


def test_query_engine_initialization(query_engine):
    """Test that query engine initializes correctly."""
    assert query_engine is not None
    assert query_engine.vector_store is not None
    assert isinstance(query_engine.conversations, dict)


def test_clear_conversation(query_engine):
    """Test clearing conversation history."""
    session_id = "test_session"
    query_engine.conversations[session_id] = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there"}
    ]
    
    query_engine.clear_conversation(session_id)
    
    assert len(query_engine.conversations[session_id]) == 0


def test_trim_conversation_history(query_engine):
    """Test trimming conversation history."""
    session_id = "test_session"
    # Add more than max_messages
    for i in range(25):
        query_engine.conversations[session_id].append({
            "role": "user" if i % 2 == 0 else "assistant",
            "content": f"Message {i}"
        })
    
    query_engine._trim_conversation_history(session_id, max_messages=20)
    
    assert len(query_engine.conversations[session_id]) <= 20


def test_get_current_config(query_engine):
    """Test getting current configuration."""
    config = query_engine.get_current_config()
    
    assert "provider" in config
    assert "model" in config
    assert "available_providers" in config
    assert isinstance(config["available_providers"], list)


def test_set_provider(query_engine):
    """Test setting provider."""
    query_engine.set_provider("gemini", "gemini-2.5-flash")
    
    assert query_engine.provider == "gemini"
    assert query_engine.model == "gemini-2.5-flash"


def test_set_provider_invalid(query_engine):
    """Test setting invalid provider raises error."""
    with pytest.raises(ValueError):
        query_engine.set_provider("invalid_provider")
