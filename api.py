from fastapi import FastAPI, UploadFile, File
import os
import shutil

from engine.custom_ocr import extract_text
from engine.similarity import generate_report

app = FastAPI()

RAW = "data/raw"
TXT = "data/extracted"

os.makedirs(RAW, exist_ok=True)
os.makedirs(TXT, exist_ok=True)


@app.post("/check")
async def check_assignments(files: list[UploadFile] = File(...)):

    for f in files:

        path = os.path.join(RAW, f.filename)

        with open(path, "wb") as buffer:

            shutil.copyfileobj(f.file, buffer)

        text = extract_text(path)

        txtname = f.filename.split(".")[0] + ".txt"

        with open(os.path.join(TXT, txtname),"w",encoding="utf-8") as t:

            t.write(text)


    report = generate_report(TXT)

    return report