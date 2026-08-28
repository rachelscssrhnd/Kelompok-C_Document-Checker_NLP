# Document Checker - Multi-Model Text Similarity Implementation on NLP-based Document Checker Web-App

**Final Project: Natural Language Processing | Python | NLP | Transformer Embeddings**

Developed a web-based document comparison system capable of analyzing 2-10 documents simultaneously across multiple formats (PDF, DOCX, TXT, and images via OCR).

Implemented an integrated NLP pipeline including text extraction, preprocessing, and pairwise similarity computation.

Applied statistical, textual, and transformer-based embeddings methods to compute similarity across documents.

---

## Tech Stack

**Frontend**
- React 18 with TypeScript
- Vite
- Tailwind CSS
- Radix UI / shadcn/ui
- Supabase (authentication and storage)

**Backend / NLP**
- Python
- NLP libraries for text extraction, OCR, and similarity computation
- Transformer-based embeddings

---

## Prerequisites

- Node.js 18+
- npm or bun
- Python 3.x (for the NLP backend)
- A Supabase project

---

## How to Run

### 1. Clone the Repository

```bash
git clone https://github.com/rachelscssrhnd/Document-Checker-Multi-Model-Text-Similarity-Implementation-on-NLP-based-Document-Checker-Web-App.git
cd Document-Checker-Multi-Model-Text-Similarity-Implementation-on-NLP-based-Document-Checker-Web-App
```

### 2. Configure Environment Variables

Create a `.env` file in the root of the project:

```bash
cp .env.example .env
```

Fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

You can find these values in your Supabase project under Settings > API.

### 3. Install Frontend Dependencies

Using npm:

```bash
npm install
```

Or using bun:

```bash
bun install
```

### 4. Start the Frontend Development Server

```bash
npm run dev
```

The app will be available at:

```
http://localhost:5173
```

### 5. Set Up the Python NLP Backend

Navigate to the Python backend folder:

```bash
cd python
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Start the backend server:

```bash
python app.py
```

### 6. Using the App

1. Open the app in your browser
2. Upload between 2 and 10 documents in any of the supported formats: PDF, DOCX, TXT, or image files (OCR supported)
3. The system will extract text, preprocess it, and compute pairwise similarity scores across all documents
4. Results are displayed as a similarity matrix using statistical, textual, and transformer-based methods

---

## Project Structure

```
Document-Checker/
├── src/            # React TypeScript frontend source
├── python/         # Python NLP backend
├── public/         # Static assets
├── supabase/       # Supabase configuration
├── index.html
├── vite.config.ts
└── package.json
```
