import os
import re
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text


def load_documents(folder):

    documents = []
    filenames = []

    for file in os.listdir(folder):

        if file.endswith(".txt"):

            path = os.path.join(folder, file)

            with open(path, "r", encoding="utf-8") as f:

                text = f.read()

                text = clean_text(text)

                documents.append(text)

            filenames.append(file)

    return documents, filenames


def compute_similarity(folder):

    docs, names = load_documents(folder)

    # character based similarity (handles OCR mistakes)
    vectorizer = TfidfVectorizer(
        analyzer="char",
        ngram_range=(3,5)
    )

    tfidf_matrix = vectorizer.fit_transform(docs)

    similarity_matrix = cosine_similarity(tfidf_matrix)

    df = pd.DataFrame(
        similarity_matrix,
        index=names,
        columns=names
    )

    print("\nSimilarity Matrix:\n")
    print(df.round(2) * 100)

    return df