from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import os

model = SentenceTransformer("all-MiniLM-L6-v2")

def compute_similarity(folder):

    docs = []
    names = []

    for file in os.listdir(folder):

        if file.endswith(".txt"):

            with open(os.path.join(folder,file),"r",encoding="utf-8") as f:
                docs.append(f.read())

            names.append(file)

    embeddings = model.encode(docs)

    sim = cosine_similarity(embeddings)

    for i in range(len(names)):
        for j in range(i+1,len(names)):

            print(f"{names[i]} vs {names[j]} -> {sim[i][j]*100:.2f}% similarity")