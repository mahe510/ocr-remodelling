# OCR Remodelling Project

This project performs OCR extraction and similarity comparison for assignment checking.

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/mahe510/ocr-remodelling.git
cd ocr-remodelling
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

### 3. Activate the virtual environment

Windows:

```bash
venv\Scripts\activate
```


### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Run the project

```bash
python main.py
```

## Project Structure

```
ocr-remodelling/
│
├── main.py
├── requirements.txt
├── .gitignore
│
├── engine/        # OCR processing logic
├── similarity/    # Similarity checking algorithms
├── data/          # Input files
```
