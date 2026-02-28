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
    Phase 6 pipeline — implement each step:

    1. TTS
       gTTS:        tts = gTTS(story["text"]); tts.save("audio.mp3")
       ElevenLabs:  POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}

    2. Captions
       - Get audio duration via ffprobe
       - Split story text into timed chunks (~3 sec each)
       - Write as an .ass or .srt subtitle file

    3. Normalize background video → always output 1080x1920 regardless of input
       Library clips are pre-cropped. User uploads use:

       ffmpeg -i {video_path} \
         -vf "scale=w=1080:h=1920:force_original_aspect_ratio=increase,
              crop=1080:1920:(iw-ow)/2:(ih-oh)/2" \
         -t {audio_duration} \
         -c:v libx264 -preset fast normalized.mp4

    4. Composite — merge normalized video + TTS audio + subtitles:

       ffmpeg -i normalized.mp4 -i audio.mp3 \
         -vf "ass=captions.ass" \
         -map 0:v -map 1:a \
         -shortest -c:v libx264 -crf 23 -preset fast \
         -c:a aac -b:a 192k \
         output/{job_id}.mp4
    """
    steps = [
        ("tts",       "Generating audio narration",  2.0),
        ("captions",  "Building caption file",       1.0),
        ("normalize", "Cropping video to portrait",  1.5),
        ("composite", "Compositing video + audio",   4.0),
        ("render",    "Rendering final output",       2.0),
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
