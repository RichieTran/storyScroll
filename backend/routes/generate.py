from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
import uuid
import asyncio
import os
import subprocess
import httpx
import aiofiles
import re

router = APIRouter()

# Expand common Reddit acronyms so TTS reads them naturally
_ACRONYM_MAP = {
    r"\bTIFU\b": "Today I fucked up",
    r"\bAITA\b": "Am I the asshole",
}

def expand_acronyms(text: str) -> str:
    for pattern, replacement in _ACRONYM_MAP.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text

OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── In-memory job tracker (replace with Redis/DB in later phases) ─────────────
JOBS: dict[str, dict] = {}


VOICE_IDS = {
    "male":   "pNInz6obpgDQGcFmaJgB",  # Adam
    "female": "21m00Tcm4TlvDq8ikWAM",  # Rachel
}

class GenerateRequest(BaseModel):
    story: dict   # { text, source, word_count, ... }
    video: dict   # { id, name, file_path, ... }
    voice: str = "male"


class JobStatus(BaseModel):
    job_id:   str
    status:   str   # "queued" | "processing" | "done" | "error"
    progress: int   # 0–100
    step:     str
    output:   str | None = None
    error:    str | None = None


async def run_generation(job_id: str, story: dict, video: dict, voice: str = "male"):
    downloaded_video = None
    try:
        story_text = expand_acronyms(story.get("text", ""))
        audio_path = os.path.join(OUTPUT_DIR, f"{job_id}_audio.mp3")
        output_path = os.path.join(OUTPUT_DIR, f"{job_id}.mp4")

        # ── Resolve video source ───────────────────────────────────────────────
        video_url = video.get("url", "")
        if video_url:
            # Download from Cloudinary (or any remote URL) to a temp file
            JOBS[job_id].update({"step": "Downloading background video", "status": "processing", "progress": 2})
            downloaded_video = os.path.join(OUTPUT_DIR, f"{job_id}_bg.mp4")
            async with httpx.AsyncClient(timeout=300.0) as client:
                async with client.stream("GET", video_url) as resp:
                    resp.raise_for_status()
                    async with aiofiles.open(downloaded_video, "wb") as f:
                        async for chunk in resp.aiter_bytes(chunk_size=1024 * 1024):
                            await f.write(chunk)
            video_path = downloaded_video
        else:
            video_path = video.get("file_path", "")

        # ── Step 1: TTS ────────────────────────────────────────────────────────
        JOBS[job_id].update({"step": "Generating audio narration", "status": "processing", "progress": 5})

        def do_tts():
            from elevenlabs.client import ElevenLabs
            client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))
            audio = client.text_to_speech.convert(
                voice_id=VOICE_IDS.get(voice, VOICE_IDS["male"]),
                text=story_text,
                model_id="eleven_multilingual_v2",
                output_format="mp3_44100_128",
            )
            with open(audio_path, "wb") as f:
                for chunk in audio:
                    if chunk:
                        f.write(chunk)

        await asyncio.to_thread(do_tts)
        JOBS[job_id]["progress"] = 30

        JOBS[job_id].update({"step": "Analyzing audio", "progress": 40})

        # ── Step 3: Composite — loop video + mix TTS audio ───────────────────
        JOBS[job_id].update({"step": "Compositing video + audio", "progress": 45})

        def do_composite():
            subprocess.run(
                [
                    "ffmpeg", "-y",
                    "-stream_loop", "-1",
                    "-i", video_path,
                    "-i", audio_path,
                    "-vf", "scale=w=720:h=1280:force_original_aspect_ratio=increase,crop=720:1280",
                    "-map", "0:v",
                    "-map", "1:a",
                    "-c:v", "libx264", "-preset", "ultrafast", "-crf", "26",
                    "-c:a", "aac", "-b:a", "128k",
                    "-shortest",
                    output_path,
                ],
                timeout=1800,
                check=True,
            )

        await asyncio.to_thread(do_composite)

        # Clean up temp audio and downloaded video
        for tmp in [audio_path, downloaded_video]:
            if tmp:
                try:
                    os.remove(tmp)
                except Exception:
                    pass

        JOBS[job_id].update({
            "status":   "done",
            "progress": 100,
            "step":     "Complete",
            "output":   f"{job_id}.mp4",
        })

    except Exception as e:
        # Clean up any temp files on error too
        for tmp in [downloaded_video]:
            if tmp:
                try:
                    os.remove(tmp)
                except Exception:
                    pass
        JOBS[job_id].update({
            "status": "error",
            "error":  str(e),
        })


@router.post("/generate")
async def start_generation(
    request: GenerateRequest,
    background_tasks: BackgroundTasks,
):
    """Queue a video generation job and return a job ID immediately."""
    story = request.story
    video = request.video
    voice = request.voice

    if not story.get("text"):
        raise HTTPException(status_code=422, detail="Story text is required.")
    if not video:
        raise HTTPException(status_code=422, detail="A video selection is required.")

    job_id = str(uuid.uuid4())[:12]
    JOBS[job_id] = {
        "job_id":   job_id,
        "status":   "queued",
        "progress": 0,
        "step":     "Queued",
        "output":   None,
        "error":    None,
    }

    background_tasks.add_task(run_generation, job_id, story, video, voice)

    return {
        "job_id":  job_id,
        "status":  "queued",
        "message": "Generation job started. Poll /api/generate/{job_id}/status for updates.",
    }


@router.get("/generate/{job_id}/status")
async def get_job_status(job_id: str):
    """Poll the status and progress of a generation job."""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job


@router.delete("/generate/{job_id}")
async def cancel_job(job_id: str):
    """Cancel and remove a job (cleanup)."""
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found.")
    del JOBS[job_id]
    return {"message": "Job cancelled."}
