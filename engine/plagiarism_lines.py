from difflib import SequenceMatcher
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


# load semantic model
model = SentenceTransformer("all-MiniLM-L6-v2")


def string_similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()


def semantic_similarity(a, b):

    emb = model.encode([a, b])

    score = cosine_similarity([emb[0]], [emb[1]])[0][0]

    return score


def classify_match(str_score, sem_score):

    if str_score > 0.8:
        return "exact"

    if sem_score > 0.45:
        return "paraphrased"

    if sem_score > 0.6:
        return "structural"

    return None


def detect_line_matches(text1, text2):

    lines1 = [l.strip() for l in text1.split("\n") if l.strip()]
    lines2 = [l.strip() for l in text2.split("\n") if l.strip()]

    matches = []

    for l1 in lines1:
        for l2 in lines2:

            str_score = string_similarity(l1, l2)

            sem_score = semantic_similarity(l1, l2)

            match_type = classify_match(str_score, sem_score)

            if match_type:

                matches.append({
                    "line_a": l1,
                    "line_b": l2,
                    "type": match_type,
                    "score": round(max(str_score, sem_score)*100,2)
                })

    return matches