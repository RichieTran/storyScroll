from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

load_dotenv()

from routes import story, reddit, videos, generate

app = FastAPI(title="StoryScroll API", version="0.1.0")

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://story-scroll-pi.vercel.app"],  # ← replace with your Vercel URL after deploying
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(story.router,    prefix="/api")
app.include_router(reddit.router,   prefix="/api")
app.include_router(videos.router,   prefix="/api")
app.include_router(generate.router, prefix="/api")

# ── Serve generated videos ───────────────────────────────────────────────────
os.makedirs("output", exist_ok=True)
app.mount("/api/video", StaticFiles(directory="output"), name="video")

# ── Serve library video files ─────────────────────────────────────────────────
os.makedirs("videos", exist_ok=True)
app.mount("/api/library", StaticFiles(directory="videos"), name="library")


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "0.1.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
