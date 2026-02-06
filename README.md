<div align="center">

# RAG Study Assistant

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_2.5-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Qdrant](https://img.shields.io/badge/Qdrant-DC382D?style=for-the-badge&logo=qdrant&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

<br/>

![Status](https://img.shields.io/badge/Status-Live-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![PRs](https://img.shields.io/badge/PRs-Welcome-orange?style=flat-square)

<br/>

**AI-powered study assistant that ingests your materials and answers questions with citations.**

<br/>

[**Live Demo**](https://ra-gg.vercel.app)

<br/>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" alt="line" width="100%">

</div>

## About

RAG Study Assistant is an intelligent learning companion powered by **Gemini 2.5**. Upload your study materials — GitHub repositories, PDF documents, or web pages — and get instant, accurate answers with source citations.

Your data is automatically deleted after **1 hour** for privacy.

## Features

| Feature | Description |
|---------|-------------|
| **Multi-Source Ingestion** | Import GitHub repos, upload PDFs, or scrape web pages |
| **Cited Answers** | Every response includes verifiable source references |
| **Semantic Search** | Powered by vector embeddings for accurate retrieval |
| **Conversation Memory** | Follow-up questions work seamlessly |
| **Auto Cleanup** | Data auto-deletes after 1 hour for privacy |
| **General Chat** | Chat even without uploaded sources |

## Tech Stack

<table>
<tr>
<td align="center" width="150">
<img src="https://skillicons.dev/icons?i=nextjs" width="48" height="48" alt="Next.js" />
<br/>Next.js 14
</td>
<td align="center" width="150">
<img src="https://skillicons.dev/icons?i=fastapi" width="48" height="48" alt="FastAPI" />
<br/>FastAPI
</td>
<td align="center" width="150">
<img src="https://skillicons.dev/icons?i=ts" width="48" height="48" alt="TypeScript" />
<br/>TypeScript
</td>
<td align="center" width="150">
<img src="https://skillicons.dev/icons?i=python" width="48" height="48" alt="Python" />
<br/>Python
</td>
<td align="center" width="150">
<img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="Tailwind" />
<br/>Tailwind CSS
</td>
</tr>
</table>

**AI & Database:** Gemini 2.5 Flash | Qdrant Vector DB

## Screenshots

| Dashboard | Chat | Sources |
|-----------|------|---------|
| View stats & recent sources | Ask questions with citations | Manage your uploaded materials |

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ingest/github` | POST | Ingest a public GitHub repository |
| `/ingest/pdf` | POST | Upload and process a PDF file |
| `/ingest/url` | POST | Scrape and ingest a web page |
| `/query` | POST | Ask a question and get cited answers |
| `/sources` | GET | List all ingested sources |
| `/sources/{id}` | DELETE | Remove a specific source |
| `/health` | GET | Check API status |

## License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute.

---

<div align="center">

Made with ❤️ by **Aniket**

</div>
