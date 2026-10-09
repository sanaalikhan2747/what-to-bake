import asyncio
from unittest.mock import patch

import pytest
from fastapi import HTTPException, Request

from speech import MAX_AUDIO_BYTES, transcribe_request


def request_audio(audio, content_type="audio/webm;codecs=opus"):
    async def receive():
        return {"type": "http.request", "body": audio, "more_body": False}

    return Request({"type": "http", "headers": [(b"content-type", content_type.encode())]}, receive)


def test_transcription_returns_voice_question():
    with patch("speech.transcribe_audio", return_value="Tell me about gift boxes"):
        result = asyncio.run(transcribe_request(request_audio(b"recorded-audio")))
    assert result == {"text": "Tell me about gift boxes"}


@pytest.mark.parametrize("audio,content_type,expected", [
    (b"", "audio/webm", 400),
    (b"data", "text/plain", 415),
    (b"data" * (MAX_AUDIO_BYTES // 4 + 1), "audio/webm", 413),
])
def test_invalid_recording_is_rejected(audio, content_type, expected):
    with pytest.raises(HTTPException) as failure:
        asyncio.run(transcribe_request(request_audio(audio, content_type)))
    assert failure.value.status_code == expected


def test_silent_recording_does_not_submit_a_message():
    with patch("speech.transcribe_audio", return_value=""), pytest.raises(HTTPException) as failure:
        asyncio.run(transcribe_request(request_audio(b"silence")))
    assert failure.value.status_code == 422


def test_failed_transcription_returns_an_actionable_error():
    with patch("speech.transcribe_audio", side_effect=ValueError("bad audio")), pytest.raises(HTTPException) as failure:
        asyncio.run(transcribe_request(request_audio(b"invalid-audio")))
    assert failure.value.status_code == 502