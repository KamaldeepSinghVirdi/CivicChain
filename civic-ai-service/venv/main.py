
import os, re, time, hashlib, base64, json, asyncio
import numpy as np
from typing import List, Dict, Optional, Any
from collections import OrderedDict

from fastapi import FastAPI, File, UploadFile, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv
load_dotenv()

from sentence_transformers import SentenceTransformer
from transformers import pipeline
import torch, faiss
from PIL import Image
import io
from torchvision import models
from openai import AsyncOpenAI

MAX_TEXT_LENGTH      = 512
MAX_PHOTOS           = 5
EMBEDDING_DIM        = 384
SIMILARITY_THRESHOLD = 0.85

print("Loading models...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

_device = 0 if torch.cuda.is_available() else -1
sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english",
    device=_device, truncation=True, max_length=512,
)

_resnet_weights = models.ResNet50_Weights.DEFAULT
img_model = models.resnet50(weights=_resnet_weights)
img_model.eval()
if torch.cuda.is_available():
    img_model = img_model.cuda()
img_transform = _resnet_weights.transforms()

_stanza_available = False
stanza_nlp = None
try:
    import stanza
    stanza.download("en", quiet=True)
    stanza_nlp = stanza.Pipeline("en", processors="tokenize,ner", use_gpu=False, verbose=False)
    _stanza_available = True
    print("Stanza loaded.")
except Exception as e:
    print(f"Stanza unavailable: {e}")

print("Models loaded.")

_faiss_lock   = asyncio.Lock()
index         = faiss.IndexFlatIP(EMBEDDING_DIM)
grievance_store = []
_emb_cache    = {}

CATEGORY_EXAMPLES = {
    "Roads & Pavements":    ["pothole on road","broken pavement","road damage","cracked street","uneven road surface"],
    "Street Lighting":      ["street light not working","broken lamp post","dark area at night","flickering street light"],
    "Garbage & Sanitation": ["garbage not collected","overflowing trash bin","illegal dumping","waste pickup missed"],
    "Water Supply":         ["no water supply","water leakage","pipe burst","water contamination","low water pressure"],
    "Sewage & Drainage":    ["blocked drain","sewer smell","drainage overflow","stagnant water","sewage backup"],
    "Public Parks":         ["park bench broken","playground equipment damaged","overgrown grass","fountain not working"],
    "Traffic Signals":      ["traffic light not working","signal timing issue","pedestrian signal broken","traffic light stuck"],
    "Other":                ["general complaint","other issue","miscellaneous problem"],
}

category_embeddings = {
    cat: np.mean(embedder.encode(exs, convert_to_tensor=False), axis=0)
    for cat, exs in CATEGORY_EXAMPLES.items()
}

URGENCY_KEYWORDS = {
    "critical": ["burst","flood","accident","blocked","emergency","severe","dangerous","injured","collapse","fire","gas leak"],
    "high":     ["broken","damaged","not working","leaking","no water","overflow","contamination","stuck","outage","hazard"],
    "medium":   ["need repair","issue","problem","concern","fix","repair"],
    "low":      ["suggestion","aesthetic","improvement","request","cosmetic"],
}
URGENCY_SCORES = {"critical":0.9,"high":0.7,"medium":0.4,"low":0.2}

class GrievanceText(BaseModel):
    text: str
    grievance_id: Optional[str] = None

class AnalysisResult(BaseModel):
    grievance_id:         str
    category:             str
    category_confidence:  float
    urgency_level:        str
    urgency_score:        float
    sentiment:            str
    sentiment_confidence: float
    key_terms:            List[str]
    entities:             Dict[str, List[str]]
    potential_duplicates: List[Dict[str, Any]]
    processing_time_ms:   float
    image_analysis:       List[Dict[str, Any]] = []

if not os.getenv("NVIDIA_API_KEY"):
    raise RuntimeError("NVIDIA_API_KEY not set.")

nvidia_client = AsyncOpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.getenv("NVIDIA_API_KEY"),
)
print("NVIDIA client ready.")

def get_text_embedding(text):
    if text not in _emb_cache:
        _emb_cache[text] = embedder.encode([text], convert_to_tensor=False)[0]
    return _emb_cache[text]

def normalize(vec):
    n = np.linalg.norm(vec)
    return vec / n if n > 0 else vec

def cosine_similarity(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))

def categorize(text):
    emb = get_text_embedding(text)
    return max(
        ((cat, cosine_similarity(emb, ce)) for cat, ce in category_embeddings.items()),
        key=lambda x: x[1]
    )

def calculate_urgency(text):
    tl = text.lower()
    for level, kws in URGENCY_KEYWORDS.items():
        if any(kw in tl for kw in kws):
            return level, URGENCY_SCORES[level]
    return "low", URGENCY_SCORES["low"]

def extract_key_terms(text, top_n=5):
    STOPWORDS = {"this","that","with","from","have","been","were","will","your","there","about","would","should","could"}
    words = re.findall(r"\b[a-z]{4,}\b", text.lower())
    return list(OrderedDict.fromkeys(w for w in words if w not in STOPWORDS))[:top_n]

def analyze_sentiment(text):
    r = sentiment_pipeline(text[:512])[0]
    return r["label"], r["score"]

def extract_entities(text):
    if _stanza_available and stanza_nlp:
        doc = stanza_nlp(text)
        ents = {}
        for e in doc.entities:
            ents.setdefault(e.type, []).append(e.text)
        return ents
    caps = re.findall(r"\b[A-Z][a-z]+(?: [A-Z][a-z]+)*\b", text)
    return {"MISC": list(set(caps))} if caps else {}

def check_duplicates(text_emb, top_k=3):
    if index.ntotal == 0:
        return []
    norm_emb = normalize(text_emb).reshape(1, -1).astype("float32")
    scores, indices = index.search(norm_emb, min(top_k, index.ntotal))
    return [
        {"grievance_id": grievance_store[idx].get("id","unknown"),
         "similarity": round(float(score), 4),
         "text": grievance_store[idx]["text"][:100] + "..."}
        for score, idx in zip(scores[0], indices[0])
        if score > SIMILARITY_THRESHOLD and idx < len(grievance_store)
    ]

async def _add_to_index(gid, text, emb):
    async with _faiss_lock:
        index.add(normalize(emb).astype("float32").reshape(1, -1))
        grievance_store.append({"id": gid, "text": text})

def _resnet_fallback(image_bytes):
    try:
        img    = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = img_transform(img).unsqueeze(0)
        if torch.cuda.is_available():
            tensor = tensor.cuda()
        with torch.no_grad():
            out = img_model(tensor)
        probs = torch.nn.functional.softmax(out[0], dim=0)
        top_p = float(torch.max(probs))
        sev   = "severe" if top_p > 0.5 else "mild" if top_p < 0.2 else "moderate"
        return {"severity": sev, "description": "ResNet50 fallback", "confidence": round(top_p, 4)}
    except Exception as e:
        return {"error": str(e)}

def _nvidia_image_sync(image_bytes, mime_type="image/jpeg"):
    """Synchronous NVIDIA call — runs in a thread to avoid blocking the event loop."""
    import httpx
    from openai import OpenAI as SyncOpenAI

    sync_client = SyncOpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=os.getenv("NVIDIA_API_KEY"),
        timeout=60.0,
    )
    b64      = base64.b64encode(image_bytes).decode()
    data_url = f"data:{mime_type};base64,{b64}"
    cats     = ", ".join(CATEGORY_EXAMPLES.keys())
    prompt   = (f"Analyse this civic grievance image. Pick exactly one category from: {cats}. "
                "Return JSON with keys: category, description, urgency (low/medium/high/critical). No extra text.")
    try:
        resp = sync_client.chat.completions.create(
            model="qwen/qwen3.5-397b-a17b",
            messages=[{"role":"user","content":[
                {"type":"image_url","image_url":{"url":data_url}},
                {"type":"text","text":prompt},
            ]}],
            max_tokens=200, temperature=0.1,
            response_format={"type":"json_object"},
        )
        return json.loads(resp.choices[0].message.content)
    except Exception as e:
        r = _resnet_fallback(image_bytes)
        r["api_error"] = str(e)
        return r

async def analyze_image_nvidia(image_bytes, mime_type="image/jpeg"):
    """Async wrapper — offloads blocking NVIDIA call to a thread."""
    return await asyncio.to_thread(_nvidia_image_sync, image_bytes, mime_type)

app = FastAPI(title="Civic Chain AI", version="3.1")

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_grievance(request: GrievanceText, background_tasks: BackgroundTasks):
    start = time.perf_counter()
    text  = request.text[:MAX_TEXT_LENGTH]
    gid   = request.grievance_id or hashlib.md5(text.encode()).hexdigest()[:12]

    (category, cat_conf), (urgency_level, urgency_score), (sentiment, sent_conf), key_terms, entities, text_emb =         await asyncio.gather(
            asyncio.to_thread(categorize,         text),
            asyncio.to_thread(calculate_urgency,  text),
            asyncio.to_thread(analyze_sentiment,  text),
            asyncio.to_thread(extract_key_terms,  text),
            asyncio.to_thread(extract_entities,   text),
            asyncio.to_thread(get_text_embedding, text),
        )

    duplicates = check_duplicates(text_emb)
    background_tasks.add_task(_add_to_index, gid, text, text_emb)
    ms = (time.perf_counter() - start) * 1000

    return AnalysisResult(
        grievance_id=gid, category=category,
        category_confidence=round(cat_conf, 4),
        urgency_level=urgency_level, urgency_score=urgency_score,
        sentiment=sentiment, sentiment_confidence=round(sent_conf, 4),
        key_terms=key_terms, entities=entities,
        potential_duplicates=duplicates, processing_time_ms=round(ms, 2),
    )

@app.post("/analyze_with_images")
async def analyze_with_images(
    title: str = Form(...), description: str = Form(...), location: str = Form(...),
    photos: List[UploadFile] = File(default=[]),
):
    text        = f"{title} {description} {location}"
    photo_bytes = await asyncio.gather(*[p.read() for p in photos])
    photo_mimes = [p.content_type or "image/jpeg" for p in photos]

    tasks   = [analyze_grievance(GrievanceText(text=text), BackgroundTasks())]
    tasks  += [analyze_image_nvidia(b, m) for b, m in zip(photo_bytes, photo_mimes)]
    results = await asyncio.gather(*tasks)

    final = results[0].model_dump()
    image_results = list(results[1:])
    if image_results:
        fi = image_results[0]
        if "category"    in fi: final["category"]      = fi["category"]
        if "urgency"     in fi: final["urgency_level"] = fi["urgency"]
        if "description" in fi: final["image_description"] = fi["description"]
    final["image_analysis"] = image_results
    return JSONResponse(content=final)

@app.get("/health")
async def health():
    return {
        "status": "healthy", "version": "3.1",
        "ner_engine": "Stanza" if _stanza_available else "regex",
        "cuda": torch.cuda.is_available(),
        "faiss_index_size": index.ntotal,
        "embedding_cache_size": len(_emb_cache),
    }
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)