# SeeKr 🔍
### An AI-Powered Search Engine for Educational Video Transcripts

Ever spent hours scrubbing through recorded lectures just to find one specific concept? That's exactly the problem **SeeKr** aims to solve.

SeeKr is an AI-powered search engine that helps students find specific topics across recorded lectures without manually going through entire videos. Instead of relying on simple keyword matching, it understands the meaning behind your query, searches through lecture transcripts, and provides the most relevant results along with their exact video timestamps.

Built around a local-first RAG (Retrieval-Augmented Generation) pipeline, SeeKr makes searching through educational content faster, smarter, and more private.

## Key Features

- **Privacy-First & Offline:** All processing happens locally on your machine. Your transcripts and queries are never sent to external cloud AI providers.
- **Semantic Search:** Understands the context and meaning of your queries using vector embeddings instead of relying only on keyword matching.
- **Accurate Timestamps:** Finds relevant sections of lectures and directs you to the exact point where a topic is discussed.
- **AI-Powered Responses:** Uses a locally running Llama 3.2 model to understand retrieved content and generate meaningful answers.
- **Clean User Interface:** A modern, responsive chat interface built with Next.js and Tailwind CSS.

## Tech Stack

| Component | Technologies |
|---|---|
| Frontend | Next.js, React, Tailwind CSS |
| Backend | Python, FastAPI |
| Data Processing | Pandas, Scikit-learn |
| Embedding Model | BGE-M3 |
| Vector Matching | Cosine Similarity |
| LLM | Llama 3.2 |
| Local Model Runtime | Ollama |
| Data Storage | Joblib |

## How It Works

SeeKr follows a simple RAG-based workflow to turn lecture transcripts into searchable knowledge.

1. **Transcript Ingestion:** Lecture audio/video is converted into text transcripts with their corresponding timestamps.
2. **Text Processing & Embeddings:** The transcripts are divided into smaller chunks, and BGE-M3 generates vector embeddings for each chunk.
3. **Local Storage:** The generated embeddings and associated transcript data are stored locally in a `.joblib` file.
4. **Semantic Retrieval:** When a user enters a query, SeeKr converts it into an embedding and uses cosine similarity to find the top 5 most relevant transcript chunks.
5. **AI Response Generation:** The retrieved chunks are passed to the locally running Llama 3.2 model through Ollama's HTTP API. The model uses this context to generate a relevant response with the corresponding video timestamps.

## Project Architecture

SeeKr uses a decoupled architecture where the frontend, backend, embedding model, and LLM work independently.

- **Frontend:** Handles user interaction and displays search results through a chat-based interface.
- **Backend:** Manages transcript processing, embedding generation, semantic retrieval, and communication with the LLM.
- **Embedding Engine:** BGE-M3 converts text into vector representations for semantic matching.
- **Reasoning Engine:** Llama 3.2 processes the retrieved context and generates human-readable responses.

## Getting Started

Follow these steps to run SeeKr locally.

### Prerequisites

Make sure you have the following installed:

- Python
- Node.js and npm
- Ollama

### 1. Set Up Ollama

Install [Ollama](https://ollama.com/) and download the required models:

```bash
ollama pull llama3.2
ollama pull bge-m3
```

### 2. Clone the Repository

```bash
git clone https://github.com/aaryan01313/SeeKr.git
cd SeeKr
```

### 3. Start the Backend

Install the Python dependencies and start the FastAPI server:

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

### 4. Start the Frontend

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

## Project Goal

The idea behind SeeKr is simple: **finding knowledge inside educational videos should be as easy as searching for something on Google.**

By combining semantic search, vector embeddings, and locally hosted LLMs, SeeKr brings AI-powered search to educational content while keeping the entire process private and independent of paid cloud APIs.

Built to make learning a little less time-consuming. 
