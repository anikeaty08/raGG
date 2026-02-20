# Agentic RAG System - Multi-Model + Web Search + Production Ready

A comprehensive, agentic RAG (Retrieval Augmented Generation) system with multi-model support, web search capabilities, and production-ready features.

## Features

### 🤖 Multi-Model Support
- **Anthropic Claude**: Opus 4.6, Sonnet, Haiku
- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-4o, o1
- **Google Gemini**: 2.5 Flash, 2.0 Flash
- **Groq**: LLaMA 3.1, Mixtral

### 🔍 Agentic Capabilities
- **Query Planning**: Intelligent query decomposition and execution planning
- **Multi-Hop Retrieval**: Iterative retrieval with query expansion and re-ranking
- **Tool Use**: Web search, code execution, calculator, file operations
- **Self-Reflection**: Answer verification and quality assessment
- **Web Search**: Tavily API (primary) + Google Search API (fallback)

### 🛠️ Tools
- **Web Search**: Real-time web search with Tavily and Google
- **Code Execution**: Sandboxed Python, JavaScript, and Bash execution
- **Calculator**: Mathematical operations and calculations
- **File Operations**: File reading and manipulation

### 🎨 Frontend Features
- **Agent Thinking UI**: Visual indicators for agent planning and execution
- **Web Search Results**: Display search results with clickable links
- **Tool Usage Display**: Show which tools are being used
- **Multi-Session Management**: Create and manage multiple chat sessions
- **Streaming Responses**: Real-time token-by-token generation
- **Model Selection**: Switch between providers/models during chat
- **Dark/Light Theme**: Theme toggle support

### 🚀 Production Features
- **Rate Limiting**: Configurable rate limits per minute/hour
- **Structured Logging**: Request IDs and structured logs
- **Error Tracking**: Sentry integration for error monitoring
- **Cost Tracking**: Track token usage and costs per provider
- **Metrics**: Analytics dashboard with usage statistics
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Security**: CORS, security headers, request validation

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Qdrant Cloud account (or self-hosted Qdrant)
- At least one LLM provider API key

### Backend Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd raGG
```

2. **Install dependencies**
```bash
cd backend
pip install -r requirements.txt
```

3. **Configure environment variables**
Create `backend/.env`:
```bash
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key

# At least one LLM provider
ANTHROPIC_API_KEY=your-anthropic-key
# OR
OPENAI_API_KEY=your-openai-key
# OR
GEMINI_API_KEY=your-gemini-key
# OR
GROQ_API_KEY=your-groq-key

# Optional: Web search
TAVILY_API_KEY=your-tavily-key
GOOGLE_SEARCH_API_KEY=your-google-search-key
GOOGLE_SEARCH_ENGINE_ID=your-engine-id

# Optional: Production
SENTRY_DSN=your-sentry-dsn
ENVIRONMENT=development
```

4. **Run the backend**
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

1. **Install dependencies**
```bash
cd frontend
npm install
```

2. **Configure environment variables**
Create `frontend/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. **Run the frontend**
```bash
npm run dev
```

4. **Open in browser**
Navigate to `http://localhost:3000`

## API Endpoints

### Query Endpoints
- `POST /query` - Query with agentic capabilities
- `POST /query/stream` - Stream query responses
- `GET /settings/model` - Get current model configuration
- `POST /settings/model` - Switch model/provider
- `GET /settings/providers` - Get available providers

### Ingestion Endpoints
- `POST /ingest/github` - Ingest GitHub repository
- `POST /ingest/pdf` - Upload and ingest PDF
- `POST /ingest/url` - Scrape and ingest web URL

### Management Endpoints
- `GET /sources` - List all sources
- `DELETE /sources/{id}` - Delete a source
- `POST /conversations/{session_id}/clear` - Clear conversation

### Analytics Endpoints
- `GET /analytics/metrics` - Get usage metrics
- `GET /analytics/providers/{provider}` - Get provider-specific metrics

## Usage Examples

### Query with Web Search
```typescript
const response = await query(
  "What are the latest developments in AI?",
  sessionId,
  5,
  undefined,
  true,  // useAgentic
  true   // useWebSearch
)
```

### Stream Query
```typescript
await queryStream(
  "Explain quantum computing",
  sessionId,
  5,
  undefined,
  true,  // useAgentic
  false, // useWebSearch
  (event) => {
    if (event.type === 'chunk') {
      console.log(event.content)
    } else if (event.type === 'web_search') {
      console.log('Web search results:', event.web_search)
    } else if (event.type === 'done') {
      console.log('Citations:', event.citations)
    }
  }
)
```

## Architecture

```
User Query
    ↓
Agentic RAG Engine
    ↓
Query Planner → Model Router → Multi-Hop Retrieval
    ↓
Tool Executor → Web Search / Code Exec / Calculator
    ↓
LLM Provider (Anthropic/OpenAI/Gemini/Groq)
    ↓
Verifier → Self-Reflection
    ↓
Final Response
```

## Documentation

- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- [Environment Variables](ENV_VARS.md) - Complete env var reference
- [API Documentation](API.md) - Detailed API reference

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Check the documentation
- Review the API reference

## Roadmap

- [ ] Additional LLM providers (Cohere, Mistral, etc.)
- [ ] Advanced tool integrations (APIs, databases)
- [ ] Enhanced multi-modal support (images, audio)
- [ ] Collaborative features (shared sessions)
- [ ] Advanced analytics and insights
