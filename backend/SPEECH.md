# Pippa Voice Input

Pippa records microphone audio and posts it to `/api/speech/transcribe`.
The backend uses faster-whisper's `tiny.en` model locally, without an API key.
Recognized questions go through the same chat flow as typed questions.

Install production packages with `pip install -r requirements.txt`. For local
tests and formatting tools, install `pip install -r requirements-dev.txt`.
Restart the API after deploying this change.
The first transcription downloads the model from Hugging Face. Later requests
reuse the in-memory model. A deployment needs network access for the first
download, or a predownloaded model directory configured using `SPEECH_MODEL`.
The local cache at `~/.cache/what-to-bake/whisper-tiny.en` is also recognized.

Microphone access requires HTTPS or localhost and permission from the browser
and operating system. Tap the microphone to start, then tap again to submit.
Recordings stop automatically after 15 seconds. Closing chat cancels recording
and transcription. Audio is processed in memory and is not saved by this endpoint.

Voice input currently recognizes English. It supports Pippa's existing menu,
gift-box, pricing, and order-help questions; it does not automatically place orders.
Spoken replies remain controlled by the voice-replies toggle.

Run focused tests with `python -m pytest tests/test_speech.py -q` from `backend`.