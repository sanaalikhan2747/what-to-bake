import asyncio
import io
import os
import threading
from pathlib import Path

from fastapi import HTTPException, Request


_model = None
_model_lock = threading.Lock()
MAX_AUDIO_BYTES = 10 * 1024 * 1024
SUPPORTED_AUDIO = {"audio/webm", "audio/mp4", "audio/ogg", "audio/wav", "audio/x-wav", "audio/aiff", "audio/x-aiff"}


def transcribe_audio(audio: bytes) -> str:
    global _model
    from faster_whisper import WhisperModel

    with _model_lock:
        if _model is None:
            cached_model = Path.home() / ".cache" / "what-to-bake" / "whisper-tiny.en"
            model_source = os.environ.get("SPEECH_MODEL") or (str(cached_model) if (cached_model / "model.bin").exists() else "tiny.en")
            _model = WhisperModel(model_source, device="cpu", compute_type="int8", cpu_threads=2)
        segments, _ = _model.transcribe(io.BytesIO(audio), language="en", beam_size=3, vad_filter=True)
        return " ".join(segment.text.strip() for segment in segments).strip()


async def transcribe_request(request: Request):
    content_type = request.headers.get("content-type", "").split(";", 1)[0].lower()
    if content_type not in SUPPORTED_AUDIO:
        raise HTTPException(status_code=415, detail="Unsupported recording format.")
    audio = bytearray()
    async for chunk in request.stream():
        audio.extend(chunk)
        if len(audio) > MAX_AUDIO_BYTES:
            raise HTTPException(status_code=413, detail="Recording is too large. Please record a shorter question.")
    if not audio:
        raise HTTPException(status_code=400, detail="The recording was empty. Please try again.")
    try:
        text = await asyncio.to_thread(transcribe_audio, bytes(audio))
    except ImportError:
        raise HTTPException(status_code=503, detail="Voice transcription is not installed on the server.")
    except Exception:
        raise HTTPException(status_code=502, detail="The recording could not be transcribed. Please try again.")
    if not text:
        raise HTTPException(status_code=422, detail="No speech was detected. Please speak clearly and try again.")
    return {"text": text[:1000]}