from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
import uuid
import asyncio
import os
import subprocess
import json

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
    try:
        story_text = story.get("text", "")
        video_path = video.get("file_path", "")
        audio_path = os.path.join(OUTPUT_DIR, f"{job_id}_audio.mp3")
        output_path = os.path.join(OUTPUT_DIR, f"{job_id}.mp4")

        # ── Step 1: TTS ────────────────────────────────────────────────────────
        JOBS[job_id].update({"step": "Generating audio narration", "status": "processing", "progress": 5})

        import edge_tts
        await edge_tts.Communicate(story_text, voice="en-US-AriaNeural").save(audio_path)
        JOBS[job_id]["progress"] = 30

        # ── Step 2: Measure audio duration ────────────────────────────────────
        JOBS[job_id].update({"step": "Analyzing audio", "progress": 35})

        def get_audio_duration():
            result = subprocess.run(
                [
                    "ffprobe", "-v", "quiet",
                    "-print_format", "json",
                    "-show_entries", "format=duration",
                    audio_path,
                ],
                capture_output=True, text=True, timeout=10,
            )
            return float(json.loads(result.stdout)["format"]["duration"])

        audio_duration = await asyncio.to_thread(get_audio_duration)
        JOBS[job_id]["progress"] = 40

        # ── Step 3: Composite — loop video + mix TTS audio ───────────────────
        JOBS[job_id].update({"step": "Compositing video + audio", "progress": 45})

        def do_composite():
            subprocess.run(
                [
                    "ffmpeg", "-y",
                    "-stream_loop", "-1",
                    "-i", video_path,
                    "-i", audio_path,
                    "-vf", "scale=w=1080:h=1920:force_original_aspect_ratio=increase,crop=1080:1920",
                    "-map", "0:v",
                    "-map", "1:a",
                    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                    "-c:a", "aac", "-b:a", "192k",
                    "-shortest",
                    output_path,
                ],
                timeout=600,
                check=True,
            )

        await asyncio.to_thread(do_composite)

        # Clean up temp audio
        try:
            os.remove(audio_path)
        except Exception:
            pass

        JOBS[job_id].update({
            "status":   "done",
            "progress": 100,
            "step":     "Complete",
            "output":   f"{job_id}.mp4",
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
