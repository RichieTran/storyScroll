# StoryScroll

Turn any story into a short-form video for TikTok or Instagram.

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev          # → http://localhost:3000
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python main.py                # → http://localhost:8000
```

## Project Structure

```
storyScroll/
├── frontend/          React + Vite app
│   └── src/
│       ├── pages/     Home, StoryInput, RedditBrowser, VideoSelection, Loading, Result
│       └── components/Navbar
└── backend/           FastAPI app
    └── routes/        story, reddit, videos, generate
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/story` | Receive story text |
| POST | `/api/story/upload` | Upload .txt/.md file |
| GET | `/api/reddit/stories` | Fetch Reddit posts |
| GET | `/api/videos` | List background video library |
| POST | `/api/videos/upload` | Upload custom video |
| POST | `/api/generate` | Start video generation job |
| GET | `/api/generate/{id}/status` | Poll job progress |
| GET | `/api/video/{id}` | Serve finished video |
# storyScroll
