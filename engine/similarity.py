import os
import re
import numpy as np
import pandas as pd

from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import AgglomerativeClustering


# Load semantic model once
model = SentenceTransformer("all-MiniLM-L6-v2")


# ---------------- CLEAN TEXT ----------------


def clean_text(text):

    text = text.lower()

    # remove punctuation but keep line breaks
    text = re.sub(r'[^a-z\n ]', ' ', text)

    # normalize spaces
    text = re.sub(r'[ ]+', ' ', text)

    # remove empty lines
    text = "\n".join(
        line.strip() for line in text.split("\n") if len(line.strip()) > 4
    )

    return text


# ---------------- LOAD DOCUMENTS ----------------

def load_documents(folder):

    docs = []
    names = []

    for file in os.listdir(folder):

        if file.endswith(".txt"):

            path = os.path.join(folder, file)

            with open(path,"r",encoding="utf-8") as f:

                text = clean_text(f.read())

                if text:

                    docs.append(text)
                    names.append(file)

    return docs, names


# ---------------- SEMANTIC SIMILARITY ----------------

def semantic_similarity(docs):

    embeddings = model.encode(docs)

    sim = cosine_similarity(embeddings)

    return sim


# ---------------- OCR ROBUST SIMILARITY ----------------

def tfidf_similarity(docs):

    vectorizer = TfidfVectorizer(
        analyzer="char",
        ngram_range=(3,5)
    )

    tfidf = vectorizer.fit_transform(docs)

    sim = cosine_similarity(tfidf)

    return sim


# ---------------- HYBRID SIMILARITY ----------------

def hybrid_similarity(docs):

    sem = semantic_similarity(docs)

    tfidf = tfidf_similarity(docs)

    # combine both signals
    sim = 0.7 * sem + 0.3 * tfidf

    return sim


# ---------------- TOP SIMILAR PAIRS ----------------

def top_similar_pairs(sim, names, threshold=0.5):

    pairs = []

    n = len(names)

    for i in range(n):
        for j in range(i+1,n):

            score = sim[i][j]

            if score > threshold:

                pairs.append({
                    "file1": names[i],
                    "file2": names[j],
                    "similarity": round(score*100,2)
                })

    pairs = sorted(pairs,key=lambda x:x["similarity"],reverse=True)

    return pairs


# ---------------- CLUSTERS ----------------

def detect_clusters(sim,names):

    if len(names) < 2:
        return []

    model = AgglomerativeClustering(
        metric="precomputed",
        linkage="average",
        distance_threshold=0.6,
        n_clusters=None
    )

    labels = model.fit_predict(1-sim)

    clusters = {}

    for i,label in enumerate(labels):

        clusters.setdefault(label,[]).append(names[i])

    return list(clusters.values())


# ---------------- NETWORK GRAPH ----------------

def build_network(sim,names,threshold=0.45):

    edges = []

    n = len(names)

    for i in range(n):
        for j in range(i+1,n):

            if sim[i][j] > threshold:

                edges.append({
                    "source":names[i],
                    "target":names[j],
                    "weight":round(sim[i][j]*100,2)
                })

    return edges


# ---------------- FINAL REPORT ----------------

def generate_report(folder):

    docs,names = load_documents(folder)

    sim = hybrid_similarity(docs)

    heatmap = pd.DataFrame(
        sim,
        index=names,
        columns=names
    ).round(2)

    pairs = top_similar_pairs(sim,names)

    clusters = detect_clusters(sim,names)

    network = build_network(sim,names)

    return {
        "heatmap": heatmap.to_dict(),
        "pairs": pairs,
        "clusters": clusters,
        "network": network
    }