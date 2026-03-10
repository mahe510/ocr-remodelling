import os

from engine.custom_ocr import extract_text
from engine.similarity import generate_report, load_documents
from engine.plagiarism_lines import detect_line_matches
from engine.heatmap import draw_heatmap

input_folder = "data/raw"
output_folder = "data/extracted"

os.makedirs(output_folder, exist_ok=True)


# -------- OCR EXTRACTION --------

for file in os.listdir(input_folder):

    if file.endswith(".png") or file.endswith(".jpg") or file.endswith(".pdf"):

        print("\nStarting:", file)
        path = os.path.join(input_folder, file)

        text = extract_text(path)

        txt_name = file.split(".")[0] + ".txt"

        with open(os.path.join(output_folder, txt_name), "w", encoding="utf-8") as f:
            f.write(text)

        print("Processed:", file)





# -------- SIMILARITY REPORT --------

report = generate_report(output_folder)


print("\n==============================")
print("TOP SIMILAR PAIRS")
print("==============================")

for p in report["pairs"]:
    score = p["similarity"]

    if score >= 80:
        risk = "HIGH RISK"
    elif score >= 60:
        risk = "MEDIUM RISK"
    else:
        risk = "LOW RISK"

    print(f'{p["file1"]} ↔ {p["file2"]} -> {score}% ({risk})')


print("\n==============================")
print("CLUSTERS")
print("==============================")

for c in report["clusters"]:
    print(c)


print("\n==============================")
print("HEATMAP MATRIX")
print("==============================")

for k, v in report["heatmap"].items():
    print(k, v)
draw_heatmap(report["heatmap"])


# -------- LINE LEVEL MATCHES --------

docs, names = load_documents(output_folder)

print("\n==============================")
print("DETAILED LINE MATCHES")
print("==============================")

docs, names = load_documents(output_folder)

for i in range(len(names)):
    for j in range(i + 1, len(names)):

        matches = detect_line_matches(docs[i], docs[j])

        if matches:

            print(f"\n{names[i]} ↔ {names[j]}")

            for m in matches[:5]:

                print("TYPE:", m["type"])
                print("A:", m["line_a"])
                print("B:", m["line_b"])
                print("Similarity:", m["score"], "%\n")