# Implementasi Multi-Model Text Similarity untuk Sistem Web Document Checker Berbasis NLP

## Identitas Kelompok 3
| Nama | NIM |
|------|-----|
| Octaviani Putri Al Fajri | 164221042 |
| Rachel Sunarko | 164231025 |
| Samuel Donovan | 164231026 |
| Arif Putra Feriza | 164231093 |
| Bunga Amanda Aurora | 164231098 |

---

## Judul Project
Implementasi Multi-Model Text Similarity untuk Sistem Web Document Checker Berbasis NLP.

## Library yang Digunakan
nltk, os, re, PyMuPDF, python-docx, pytesseract, pdf2image, scikit-learn, sentence-transformer, rapidfuzz, jellyfish, numpy, matplotlib, seaborn, python-doctr, mplcursor.

## Tata Cara Penggunaan Code
Clone repository dengan perintah berikut:

```git clone https://github.com/rachelscssrhnd/Kelompok-C_Document-Checker_NLP.git```

```cd Kelompok-C_Document-Checker_NLP```

Persiapan Python (Windows PowerShell) dilakukan dengan membuat virtual environment, mengaktifkannya, lalu menginstal dependency backend:

```python -m venv .venv```

```.venv\Scripts\Activate.ps1```

```pip install -r python\requirements.txt```

Menjalankan backend (FastAPI) dilakukan dengan masuk ke folder python dan menjalankan server:

```cd python```

```python api.py```

Persiapan dan menjalankan frontend (Vite/React) dilakukan dengan kembali ke root project, menginstal package frontend, lalu menjalankan development server:

```cd ..```

```npm install```

```npm run dev```

Aplikasi dapat diakses melalui URL yang muncul di terminal, misalnya http://localhost:8081.
