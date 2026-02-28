from fastapi import APIRouter, UploadFile, File, HTTPException, Query
import aiofiles
import os
import uuid
import subprocess
import json

router = APIRouter()

VIDEOS_DIR = "videos"
os.makedirs(VIDEOS_DIR, exist_ok=True)


def probe_duration(file_path: str) -> str | None:
    """Use ffprobe to read the actual video duration. Returns 'M:SS' or None."""
    if not os.path.exists(file_path):
        return None
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "quiet",
                "-print_format", "json",
                "-show_entries", "format=duration",
                file_path,
            ],
            capture_output=True, text=True, timeout=5,
        )
        data     = json.loads(result.stdout)
        duration = float(data["format"]["duration"])
        mins     = int(duration // 60)
        secs     = int(duration % 60)
        return f"{mins}:{secs:02d}"
    except Exception:
        return None

# ── In-memory library (replace with SQLite in Phase 5) ───────────────────────
VIDEO_LIBRARY: list[dict] = [
    {
        "id":         "mc-1",
        "name":       "Minecraft Parkour Clip 1",
        "category":   "Minecraft Parkour",
        "categoryId": "minecraft",
        "file_path":  "videos/mc_parkour_1.mp4",
        "color":      "#4ec9b0",
    },
    {
        "id":         "mc-2",
        "name":       "Minecraft Parkour Clip 2",
        "category":   "Minecraft Parkour",
        "categoryId": "minecraft",
        "file_path":  "videos/mc_parkour_2.mp4",
        "color":      "#4ec9b0",
    },
    {
        "id":         "ss-1",
        "name":       "Subway Surfers Clip 1",
        "category":   "Subway Surfers",
        "categoryId": "subway",
        "file_path":  "videos/subway_1.mp4",
        "color":      "#ce9178",
    },
    {
        "id":         "ss-2",
        "name":       "Subway Surfers Clip 2",
        "category":   "Subway Surfers",
        "categoryId": "subway",
        "file_path":  "videos/subway_2.mp4",
        "color":      "#ce9178",
    },
    {
        "id":         "tm-1",
        "name":       "Trackmania Clip 1",
        "category":   "Trackmania",
        "categoryId": "trackmania",
        "file_path":  "videos/trackmania_1.mp4",
        "color":      "#9cdcfe",
    },
    {
        "id":         "gta-1",
        "name":       "GTA Driving Clip 1",
        "category":   "GTA Driving",
        "categoryId": "gta",
        "file_path":  "videos/gta_1.mp4",
        "color":      "#f44747",
    },
    {
        "id":         "sat-1",
        "name":       "Satisfying Clip 1",
        "category":   "Satisfying / Slime",
        "categoryId": "satisfying",
        "file_path":  "videos/satisfying_1.mp4",
        "color":      "#c586c0",
    },
    {
        "id":         "nat-1",
        "name":       "Nature Clip 1",
        "category":   "Nature / Scenery",
        "categoryId": "nature",
        "file_path":  "videos/nature_1.mp4",
        "color":      "#6a9955",
    },
]


@router.get("/videos")
async def list_videos(
    category: str | None = Query(None, description="Filter by categoryId"),
):
    """Return available background videos from the library."""
    videos = VIDEO_LIBRARY
    if category:
        videos = [v for v in videos if v["categoryId"] == category]

    videos_out = [
        {**v, "duration": probe_duration(v["file_path"])}
        for v in videos
    ]

    return {
        "count":      len(videos_out),
        "videos":     videos_out,
        "categories": list({v["categoryId"]: v["category"] for v in VIDEO_LIBRARY}.items()),
    }


@router.get("/videos/{video_id}")
async def get_video(video_id: str):
    """Get metadata for a single video by ID."""
    video = next((v for v in VIDEO_LIBRARY if v["id"] == video_id), None)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found.")
    return video


@router.post("/videos/upload")
async def upload_video(file: UploadFile = File(...)):
    """Accept a user-uploaded video file for use as background footage."""
    allowed = (".mp4", ".mov", ".webm")
    if not any(file.filename.lower().endswith(ext) for ext in allowed):
        raise HTTPException(
            status_code=400,
            detail="Only .mp4, .mov, and .webm files are supported."
        )

    # 500 MB limit
    MAX_SIZE = 500 * 1024 * 1024
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 500 MB).")

    file_id   = str(uuid.uuid4())[:8]
    save_name = f"{file_id}_{file.filename}"
    save_path = os.path.join(VIDEOS_DIR, save_name)

    async with aiofiles.open(save_path, "wb") as f:
        await f.write(contents)

    return {
        "video_id":  file_id,
        "filename":  file.filename,
        "file_path": save_path,
        "size_mb":   round(len(contents) / (1024 * 1024), 2),
        "message":   "Video uploaded successfully.",
    }
