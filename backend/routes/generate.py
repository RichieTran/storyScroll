from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
import uuid
import asyncio
import os

router = APIRouter()

OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── In-memory job tracker (replace with Redis/DB in later phases) ─────────────
JOBS: dict[str, dict] = {}


class GenerateRequest(BaseModel):
    story: dict   # { text, source, word_count, ... }
    video: dict   # { id, name, file_path, ... }


class JobStatus(BaseModel):
    job_id:   str
    status:   str   # "queued" | "processing" | "done" | "error"
    progress: int   # 0–100
    step:     str
    output:   str | None = None
    error:    str | None = None


async def run_generation(job_id: str, story: dict, video: dict):
    """
    Placeholder pipeline — replace each step with real implementations:
      1. TTS  → generate audio from story text (gTTS / ElevenLabs)
      2. Captions → create SRT subtitle file
      3. FFmpeg  → composite audio + captions over background video
    """
    steps = [
        ("tts",      "Generating TTS audio",     2.0),
        ("captions", "Building caption file",    1.0),
        ("composite","Compositing video + audio", 4.0),
        ("render",   "Rendering final output",    2.0),
    ]

    try:
        total_time = sum(s[2] for s in steps)
        elapsed    = 0.0

        for step_id, step_label, duration in steps:
            JOBS[job_id].update({"step": step_label, "status": "processing"})
            await asyncio.sleep(duration)
            elapsed += duration
            progress = int((elapsed / total_time) * 100)
            JOBS[job_id]["progress"] = min(progress, 99)

        # TODO: actual output file will be written by FFmpeg here
        output_path = os.path.join(OUTPUT_DIR, f"{job_id}.mp4")
        JOBS[job_id].update({
            "status":   "done",
            "progress": 100,
            "step":     "Complete",
            "output":   output_path,
        })

    except Exception as e:
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

    background_tasks.add_task(run_generation, job_id, story, video)

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
