from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib
import requests
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

df = joblib.load('embeddings.joblib')

class QueryRequest(BaseModel):
    query: str

def get_query_embedding(text):
    r = requests.post("http://localhost:11434/api/embed", json={
        "model": "bge-m3",
        "input": [text]
    })
    return r.json()["embeddings"][0]

@app.post("/search")
async def search_course(request: QueryRequest):
    try:
        question_embedding = get_query_embedding(request.query)
        
        similarities = cosine_similarity(np.vstack(df['embedding']), [question_embedding]).flatten()
        max_indx = similarities.argsort()[::-1][0:5]
        new_df = df.loc[max_indx]
        
        prompt = f'''Answer the user's question based strictly on these video transcripts.
        Cite the exact video title, number, and timestamps. If not found, say so.

        {new_df[["title", "number", "start", "end", "text"]].to_json(orient="records")}
        ---------------------------------
        User Query: "{request.query}"
        '''

        response_text = ""
        used_model = ""

        try:
            r = requests.post("http://localhost:11434/api/generate", json={
                "model": "llama3.2",
                "prompt": prompt,
                "stream": False
            })
            response_text = r.json()["response"]
            used_model = "Local Llama"
        except Exception:
            response_text = "Error running models."

        sources = new_df[["title", "number", "start", "end", "text"]].to_dict(orient="records")

        return {
            "answer": response_text,
            "model": used_model,
            "sources": sources
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))