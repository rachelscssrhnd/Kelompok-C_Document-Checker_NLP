import nltk
nltk.download('punkt')
nltk.download('punkt_tab')
nltk.download('stopwords')
nltk.download('wordnet')

import os
import re
import tempfile
import traceback
import uuid
import fitz
import docx
import pytesseract
import numpy as np
import pandas as pd
import jellyfish
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pdf2image import convert_from_path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from rapidfuzz import fuzz
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk import word_tokenize
import nltk
from sentence_transformers import SentenceTransformer
from doctr.io import DocumentFile
from doctr.models import ocr_predictor

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger("document_checker")

app = FastAPI(title="Document Similarity Checker")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


STOPWORDS = set(stopwords.words('english'))
LEM = WordNetLemmatizer()


LOGGER.info("Loading OCR model...")
try:
    OCR_MODEL = ocr_predictor(
        det_arch='db_resnet50',
        reco_arch='crnn_vgg16_bn',
        pretrained=True
    )
    LOGGER.info("OCR model loaded successfully")
except Exception:
    OCR_MODEL = None
    LOGGER.exception("Failed to initialize OCR model")

LOGGER.info("Loading embedding models...")
_MODEL_MINILM = SentenceTransformer("all-MiniLM-L6-v2")
_MODEL_MPNET = SentenceTransformer("all-mpnet-base-v2")
_MODEL_MULTI = SentenceTransformer("paraphrase-multilingual-mpnet-base-v2")
LOGGER.info("Embedding models loaded successfully")


class SimilarityRequest(BaseModel):
    file_paths: List[str]

class SimilarityResponse(BaseModel):
    tfidf_cosine: List[List[float]]
    jaccard: List[List[float]]
    levenshtein: List[List[float]]
    jaro_winkler: List[List[float]]
    embedding: Dict[str, List[List[float]]]

def extract_text_docx(path: str) -> str:
    """Extract text from a DOCX file."""
    try:
        d = docx.Document(path)
        return "\n".join(p.text for p in d.paragraphs if p.text.strip())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading DOCX file: {str(e)}")

def extract_text_pdf(path: str) -> str:
    """Extract text from a PDF file."""
    try:
        doc = fitz.open(path)
        text = "\n".join(page.get_text("text") for page in doc)
        doc.close()
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF file: {str(e)}")

def extract_text_image_ocr(path: str) -> str:
    """Extract text from an image using OCR."""
    try:
        if OCR_MODEL is not None:
            doc = DocumentFile.from_images(path)
            result = OCR_MODEL(doc)
            words = []
            for page in result.pages:
                for block in page.blocks:
                    for line in block.lines:
                        for word in line.words:
                            words.append(word.value)
            return " ".join(words)
        raise RuntimeError("OCR model unavailable")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error performing OCR: {str(e)}")

def extract_text(path: str) -> str:
    """Extract text from a file based on its extension."""
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    
    ext = os.path.splitext(path)[1].lower()
    
    if ext == ".docx":
        return extract_text_docx(path)
    elif ext == ".pdf":
        return extract_text_pdf(path)
    elif ext in [".jpg", ".jpeg", ".png"]:
        return extract_text_image_ocr(path)
    else:
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading text file: {str(e)}")

def clean_text(t: str) -> str:
    """Clean and normalize text."""
    t = re.sub(r'\s+', ' ', t)
    return t.strip()

def preprocess(t: str) -> str:
    """Preprocess text for similarity comparison."""
    t = clean_text(t.lower())
    tokens = [
        w for w in word_tokenize(t)
        if w.isalpha() and w not in STOPWORDS
    ]
    tokens = [LEM.lemmatize(w) for w in tokens]
    return " ".join(tokens)

def jaccard_sim_matrix(texts: List[str]) -> np.ndarray:
    """Calculate Jaccard similarity matrix."""
    sets = [set(t.split()) for t in texts]
    n = len(sets)
    M = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            a, b = sets[i], sets[j]
            M[i, j] = len(a & b) / (len(a | b) + 1e-12)
    return M

def levenshtein_matrix(texts: List[str]) -> np.ndarray:
    """Calculate Levenshtein similarity matrix."""
    n = len(texts)
    M = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            M[i, j] = fuzz.ratio(texts[i], texts[j]) / 100
    return M

def jaro_winkler_matrix(texts: List[str]) -> np.ndarray:
    """Calculate Jaro-Winkler similarity matrix."""
    n = len(texts)
    M = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            M[i, j] = jellyfish.jaro_winkler_similarity(texts[i], texts[j])
    return M

def embed_sim(texts: List[str]) -> np.ndarray:
    emb = _MODEL_MINILM.encode(texts, batch_size=16, convert_to_numpy=True)
    return cosine_similarity(emb)

def embed_allmpnet(texts: List[str]) -> np.ndarray:
    emb = _MODEL_MPNET.encode(texts, batch_size=16, convert_to_numpy=True, normalize_embeddings=True)
    return cosine_similarity(emb)

def embed_multimpnet(texts: List[str]) -> np.ndarray:
    emb = _MODEL_MULTI.encode(texts, batch_size=16, convert_to_numpy=True, normalize_embeddings=True)
    return cosine_similarity(emb)

@app.post("/api/check-similarity", response_model=SimilarityResponse)
async def check_similarity(files: List[UploadFile] = File(...)):
    """
    Check similarity between multiple documents.
    Accepts multiple files and returns similarity matrices.
    """
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Upload minimal 2 dokumen.")

    try:
        with tempfile.TemporaryDirectory(prefix="doc_checker_") as tmpdir:
            temp_files: List[str] = []
            for file in files:
                original_name = file.filename or "upload"
                suffix = Path(original_name).suffix.lower()
                safe_name = f"{uuid.uuid4().hex}{suffix}" if suffix else f"{uuid.uuid4().hex}.bin"
                file_path = str(Path(tmpdir) / safe_name)
                content = await file.read()
                with open(file_path, "wb") as f:
                    f.write(content)
                temp_files.append(file_path)

            result = run_checker(temp_files)
            return result
    except HTTPException:
        raise
    except Exception as e:
        LOGGER.exception("/api/check-similarity failed")
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")

def run_checker(filepaths: List[str]) -> Dict[str, Any]:
    try:
        if len(filepaths) < 2:
            raise HTTPException(status_code=400, detail="Upload minimal 2 dokumen.")

        raw_texts = [extract_text(fp) for fp in filepaths]
        processed_texts = [preprocess(t) for t in raw_texts]

        if all((not t) or (not t.strip()) for t in processed_texts):
            raise HTTPException(
                status_code=400,
                detail="Tidak ada teks yang bisa diekstrak dari dokumen. Pastikan file tidak kosong dan format didukung.",
            )

        tfidf = TfidfVectorizer()
        try:
            X = tfidf.fit_transform(processed_texts)
        except ValueError as ve:
            LOGGER.warning("TF-IDF failed (%s), retrying with char analyzer", str(ve))
            tfidf = TfidfVectorizer(analyzer="char", ngram_range=(3, 5))
            X = tfidf.fit_transform([t if t and t.strip() else "_" for t in processed_texts])
        cosine = cosine_similarity(X)

        jacc = jaccard_sim_matrix(processed_texts)
        lev = levenshtein_matrix(raw_texts)
        jw = jaro_winkler_matrix(raw_texts)

        embedding_results: Dict[str, np.ndarray] = {}
        for name, fn in (
            ("MiniLM", embed_sim),
            ("MPNet", embed_allmpnet),
            ("Multi_MPNet", embed_multimpnet),
        ):
            try:
                embedding_results[name] = fn(raw_texts)
            except Exception as ex:
                LOGGER.warning("Embedding model %s failed: %s", name, str(ex))

        return {
            "tfidf_cosine": cosine.tolist(),
            "jaccard": jacc.tolist(),
            "levenshtein": lev.tolist(),
            "jaro_winkler": jw.tolist(),
            "embedding": {k: v.tolist() for k, v in embedding_results.items()},
        }
    except HTTPException:
        raise
    except Exception as e:
        LOGGER.error("run_checker failed: %s\n%s", str(e), traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error in similarity analysis: {type(e).__name__}: {str(e)}")

def pretty_output_transposed(result: Dict[str, Any]) -> pd.DataFrame:
    """
    Convert similarity results to a formatted DataFrame.
    
    Args:
        result: Dictionary containing similarity matrices
        
    Returns:
        Formatted DataFrame with similarity scores
    """
    cosine = np.array(result["tfidf_cosine"])
    jacc = np.array(result["jaccard"])
    lev = np.array(result["levenshtein"])
    jw = np.array(result["jaro_winkler"])
    emb_minilm = np.array(result["embedding"]["MiniLM"])
    emb_mpnet = np.array(result["embedding"]["MPNet"])
    emb_multi = np.array(result["embedding"]["Multi_MPNet"])

    n = cosine.shape[0]
    pairs = [(i, j) for i in range(n) for j in range(i+1, n)]
    pair_names = [f"Doc{i+1}–Doc{j+1}" for i, j in pairs]

    rows = []
    for (i, j), pair_name in zip(pairs, pair_names):
        rows.append({
            "Pair": pair_name,
            "Cosine (TF-IDF)": round(float(cosine[i, j]), 4),
            "Jaccard": round(float(jacc[i, j]), 4),
            "Levenshtein Distance": round(float(lev[i, j]), 4),
            "Jaro-Winkler": round(float(jw[i, j]), 4),
            "Embedding (MiniLM)": round(float(emb_minilm[i, j]), 4),
            "Embedding (MPNet)": round(float(emb_mpnet[i, j]), 4),
            "Embedding (Multi MPNet)": round(float(emb_multi[i, j]), 4),
        })

    return pd.DataFrame(rows)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
