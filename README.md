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

## Cara Menjalankan Aplikasi

### 1. Clone Repository
```bash
git clone https://github.com/rachelscssrhnd/Kelompok-C_Document-Checker_NLP.git
cd Kelompok-C_Document-Checker_NLP
```

### 2. Setup Backend (Python)
```bash
# Buat virtual environment
python -m venv .venv

# Aktifkan virtual environment (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Install dependencies backend
pip install -r python\requirements.txt

# Jalankan backend server
cd python
python api.py
```
Backend akan berjalan di `http://localhost:8000`

### 3. Setup Frontend (React/Vite)
```bash
# Kembali ke root project
cd ..

# Install dependencies frontend
npm install

# Jalankan development server
npm run dev
```
Frontend akan berjalan di `http://localhost:8081` (atau URL yang ditampilkan di terminal)

### 4. Akses Aplikasi
Buka browser dan akses `http://localhost:8081` untuk menggunakan aplikasi Document Checker.
