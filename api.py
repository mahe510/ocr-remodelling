from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil

from engine.custom_ocr import extract_text
from engine.similarity import generate_report

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RAW = "data/raw"
TXT = "data/extracted"

os.makedirs(RAW, exist_ok=True)
os.makedirs(TXT, exist_ok=True)


@app.post("/check")
async def check_assignments(files: list[UploadFile] = File(...)):
    if len(files) < 2:
        return {"error": "Please upload at least 2 PDF files."}

    for name in os.listdir(TXT):
        path = os.path.join(TXT, name)
        if os.path.isfile(path):
            try:
                os.remove(path)
            except PermissionError:
                pass

    for f in files:
        raw_path = os.path.join(RAW, f.filename)

        with open(raw_path, "wb") as buffer:
            shutil.copyfileobj(f.file, buffer)

        text = extract_text(raw_path)
        txtname = f.filename.rsplit(".", 1)[0] + ".txt"

        with open(os.path.join(TXT, txtname), "w", encoding="utf-8") as t:
            t.write(text)

    report = generate_report(TXT)
    return report