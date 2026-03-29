import cv2
import pytesseract
import numpy as np
import pdfplumber
from pdf2image import convert_from_path

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

POPPLER_PATH = r"C:\poppler-25.12.0\Library\bin"


def preprocess(img):

    # shrink large PDF images
    img = cv2.resize(img, None, fx=0.5, fy=0.5)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # upscale handwriting
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

    blur = cv2.GaussianBlur(gray, (3,3), 0)

    return blur


def extract_text(file_path):

    text = ""

    # ---------------- PDF ----------------
    if file_path.lower().endswith(".pdf"):

        #print("Checking PDF text layer...")

        # try extracting text directly
        with pdfplumber.open(file_path) as pdf:

            for page in pdf.pages:

                page_text = page.extract_text()

                if page_text:
                    text += page_text + "\n"


        #print("No PDF text layer found → using OCR")

        # OCR fallback
        pages = convert_from_path(
            file_path,
            dpi=150,
            poppler_path=POPPLER_PATH
        )

        print("Total pages:", len(pages))

        for i, page in enumerate(pages):

            print("Running OCR on page", i+1)

            img = np.array(page)
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

            processed = preprocess(img)

            page_text = pytesseract.image_to_string(
                processed,
                config="--oem 3 --psm 6"
            )

            text += page_text + "\n"

        return text


    # ---------------- IMAGE ----------------

    img = cv2.imread(file_path)

    if img is None:
        return ""

    processed = preprocess(img)

    text = pytesseract.image_to_string(
        processed,
        config="--oem 3 --psm 6"
    )

    return text