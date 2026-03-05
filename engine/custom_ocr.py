from paddleocr import PaddleOCR
import re
from engine.preprocessing import preprocess_image

ocr = PaddleOCR(lang='en')

def extract_text(image_path):

    processed = preprocess_image(image_path)

    results = ocr.ocr(processed)

    words = []

    if results:
        for line in results:
            for word in line:
                words.append(word[1][0])

    text = " ".join(words)

    # -------- TEXT CLEANING --------
    text = text.lower()
    text = re.sub(r'[^a-z\s]', ' ', text)

    words = text.split()
    words = [w for w in words if len(w) > 2]

    cleaned_text = " ".join(words)
    # --------------------------------

    return cleaned_text