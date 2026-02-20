# Integration Guide - Agentic RAG System

## 🎉 Implementation Complete!

All features from the agentic RAG system plan have been implemented. Here's what's been added and how to use it.

## ✅ Completed Features

### Backend

1. **Multi-Model Provider Architecture**
   - Unified provider interface (`backend/app/rag/providers/base.py`)
   - Anthropic Claude provider (`backend/app/rag/providers/anthropic.py`)
   - OpenAI provider (`backend/app/rag/providers/openai.py`)
   - Enhanced Gemini provider (`backend/app/rag/providers/gemini.py`)
   - Enhanced Groq provider (`backend/app/rag/providers/groq.py`)
   - Provider factory (`backend/app/rag/providers/factory.py`)
   - Smart model router (`backend/app/rag/router/model_router.py`)

2. **Tool System**
   - Base tool interface (`backend/app/rag/tools/base.py`)
   - Tool registry (`backend/app/rag/tools/registry.py`)
   - Tavily web search (`backend/app/rag/tools/web_search_tavily.py`)
   - Google Search API (`backend/app/rag/tools/web_search_google.py`)
   - Calculator tool (`backend/app/rag/tools/calculator.py`)
   - Code executor (`backend/app/rag/tools/code_executor.py`)
   - Tool executor (`backend/app/rag/agent/tool_executor.py`)

3. **Agentic Engine**
   - Agentic RAG engine (`backend/app/rag/agent/agentic_engine.py`)
   - Query planner (`backend/app/rag/agent/planner.py`)
   - Function calling handler (`backend/app/rag/agent/function_calling.py`)
   - Answer verifier (`backend/app/rag/agent/verifier.py`)
   - Self-reflection (`backend/app/rag/agent/reflection.py`)

4. **Multi-Hop Retrieval**
   - Multi-hop retrieval (`backend/app/rag/retrieval/multi_hop.py`)
   - Query expander (`backend/app/rag/retrieval/query_expander.py`)
   - Re-ranker (`backend/app/rag/retrieval/reranker.py`)

5. **Production Features**
   - Rate limiting middleware (`backend/app/middleware/rate_limit.py`)
   - Structured logging (`backend/app/middleware/logging.py`)
   - Security middleware (`backend/app/middleware/security.py`)
   - Metrics collector (`backend/app/analytics/metrics.py`)
   - Sentry integration (in `main.py`)

### Frontend

1. **UI Components**
   - Agent thinking indicator (`frontend/src/components/AgentThinking.tsx`)
   - Web search results display (`frontend/src/components/WebSearchResults.tsx`)
   - Tool usage display (`frontend/src/components/ToolUsage.tsx`)

2. **API Updates**
   - Updated `queryStream` to support agentic features
   - Added `getAvailableProviders` function
   - Added `getMetrics` and `getProviderMetrics` functions
   - Updated query functions to support `useAgentic` and `useWebSearch` flags

3. **Chat Page Integration**
   - Added agentic/web search toggles in chat header
   - Integrated agent thinking, web search results, and tool usage displays
   - Updated message interface to include plan, webSearchResults, and toolsUsed

## 🚀 How to Use

### 1. Set Up Environment Variables

Add these to your `backend/.env`:

```bash
# Required: At least one LLM provider
ANTHROPIC_API_KEY=sk-ant-xxx
# OR
OPENAI_API_KEY=sk-xxx
# OR
GEMINI_API_KEY=AIza...
# OR
GROQ_API_KEY=gsk_xxx

# Optional: Web Search
TAVILY_API_KEY=tvly-xxx
GOOGLE_SEARCH_API_KEY=AIza...
GOOGLE_SEARCH_ENGINE_ID=xxxxx

# Optional: Production
SENTRY_DSN=https://xxx@sentry.io/xxx
ENVIRONMENT=production
```

### 2. Install New Dependencies

```bash
cd backend
pip install -r requirements.txt
```

New dependencies added:
- `anthropic>=0.18.0`
- `openai>=1.12.0`
- `tavily-python>=0.3.0`
- `google-api-python-client>=2.100.0`
- `slowapi>=0.1.9`
- `sentry-sdk[fastapi]>=1.40.0`
- `cross-encoder>=0.3.0`
- `sentence-transformers>=2.2.0`

### 3. Start the Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

The backend will automatically:
- Initialize the agentic engine
- Register available tools
- Set up middleware (logging, security, rate limiting)
- Initialize Sentry if DSN is provided

### 4. Start the Frontend

```bash
cd frontend
npm install  # If you haven't already
npm run dev
```

### 5. Use Agentic Features in the UI

1. **Enable Agentic Mode**: Toggle "Agentic" checkbox in chat header
2. **Enable Web Search**: Toggle "Web Search" checkbox in chat header
3. **Select Model**: Click the model selector to switch providers/models
4. **View Agent Thinking**: See execution plans and tool usage in real-time
5. **View Web Search Results**: See web search results above assistant responses

## 📡 API Usage Examples

### Query with Agentic Features

```typescript
import { query } from '@/lib/api'

const response = await query(
  "What are the latest AI developments?",
  sessionId,
  5,
  undefined,
  true,  // useAgentic
  true   // useWebSearch
)
```

### Stream with Agentic Features

```typescript
import { queryStream, StreamEvent } from '@/lib/api'

await queryStream(
  "Explain quantum computing",
  sessionId,
  5,
  undefined,
  true,  // useAgentic
  true,  // useWebSearch
  (event: StreamEvent) => {
    switch (event.type) {
      case 'chunk':
        console.log('Chunk:', event.content)
        break
      case 'web_search':
        console.log('Web results:', event.web_search)
        break
      case 'done':
        console.log('Citations:', event.citations)
        break
      case 'error':
        console.error('Error:', event.error)
        break
    }
  }
)
```

### Get Available Providers

```typescript
import { getAvailableProviders } from '@/lib/api'

const providers = await getAvailableProviders()
console.log(providers)
// {
//   providers: {
//     anthropic: { models: [...], supports_function_calling: true },
//     openai: { models: [...], supports_function_calling: true },
//     ...
//   }
// }
```

### Get Metrics

```typescript
import { getMetrics } from '@/lib/api'

const metrics = await getMetrics()
console.log(metrics)
// {
//   total_queries: 100,
//   total_tokens: 50000,
//   total_cost: 0.25,
//   avg_duration_ms: 1200,
//   success_rate: 0.98,
//   providers: { ... }
// }
```

## 🔧 Configuration

### Rate Limiting

Adjust in `backend/.env`:
```bash
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000
```

### Web Search Cache

Adjust in `backend/.env`:
```bash
WEB_SEARCH_CACHE_TTL_SECONDS=3600
```

### Model Selection

The system automatically selects the best available provider. You can also:
- Set preferred provider via `/settings/model` endpoint
- Use model router for automatic routing based on query complexity

## 🐛 Troubleshooting

### "No LLM provider available"
- Ensure at least one provider API key is set in environment variables
- Check that the API key is valid

### "Tool not found" errors
- Web search tools require API keys (Tavily or Google Search)
- Check that tools are properly initialized in `agentic_engine.py`

### Rate limiting errors
- Adjust `RATE_LIMIT_PER_MINUTE` if needed
- Check logs for rate limit details

### Frontend not connecting
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS settings in backend
- Ensure backend is running

## 📊 Monitoring

### Metrics Endpoint
```bash
curl http://localhost:8000/analytics/metrics
```

### Provider Metrics
```bash
curl http://localhost:8000/analytics/providers/anthropic
```

### Health Check
```bash
curl http://localhost:8000/health
```

## 🎯 Next Steps

1. **Add API Keys**: Set up at least one LLM provider
2. **Test Web Search**: Add Tavily or Google Search API keys
3. **Enable Sentry**: Add Sentry DSN for error tracking
4. **Deploy**: Follow `DEPLOYMENT.md` for production deployment

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT.md) - Production deployment
- [Environment Variables](ENV_VARS.md) - Complete env var reference
- [README](README.md) - Project overview

## 🎉 You're Ready!

The agentic RAG system is fully implemented and ready to use. Start by:
1. Adding your API keys
2. Starting the backend and frontend
3. Testing with a query that needs web search (e.g., "What's the latest news about AI?")

Enjoy your agentic RAG system! 🚀
