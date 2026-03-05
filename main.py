import os
from engine.custom_ocr import extract_text
from engine.similarity import compute_similarity   # ADD THIS

input_folder = "data/raw"
output_folder = "data/extracted"

for file in os.listdir(input_folder):

    if file.endswith(".png") or file.endswith(".jpg"):

        image_path = os.path.join(input_folder, file)

        text = extract_text(image_path)

        output_file = file.split(".")[0] + ".txt"

        with open(os.path.join(output_folder, output_file), "w", encoding="utf-8") as f:
            f.write(text)

        print(f"Processed: {file}")

# ---- ADD THIS PART ----
print("\nSimilarity Results:\n")
compute_similarity(output_folder)