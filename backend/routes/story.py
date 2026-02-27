from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import aiofiles
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class StoryPayload(BaseModel):
    text: str
    source: str = "manual"   # "write" | "paste" | "upload" | "reddit"
    title: str | None = None
    word_count: int | None = None


@router.post("/story")
async def receive_story(payload: StoryPayload):
    """Receive and validate a story text submitted from the frontend."""
    text = payload.text.strip()
    if len(text) < 10:
        raise HTTPException(status_code=422, detail="Story text is too short (min 10 characters).")

    word_count = len(text.split())
    story_id   = str(uuid.uuid4())[:8]

    return {
        "story_id":  story_id,
        "source":    payload.source,
        "word_count": word_count,
        "char_count": len(text),
        "preview":   text[:200],
        "message":   "Story received successfully.",
    }


@router.post("/story/upload")
async def upload_story_file(file: UploadFile = File(...)):
    """Accept a .txt or .md file and return its contents as story text."""
    if not file.filename.endswith((".txt", ".md")):
        raise HTTPException(status_code=400, detail="Only .txt and .md files are supported.")

    contents = await file.read()
    try:
        text = contents.decode("utf-8").strip()
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded text.")

    if not text:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Persist for later processing
    file_id   = str(uuid.uuid4())[:8]
    save_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    async with aiofiles.open(save_path, "w", encoding="utf-8") as f:
        await f.write(text)

    return {
        "file_id":   file_id,
        "filename":  file.filename,
        "word_count": len(text.split()),
        "char_count": len(text),
        "text":      text,
        "message":   "File uploaded and parsed successfully.",
    }
