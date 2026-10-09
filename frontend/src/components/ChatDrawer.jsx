import { useEffect, useRef, useState } from "react";
import { ArrowUp, Mic, MicOff, MessageCircle, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { api, waLink } from "@/state/api";
import MagicBaker from "@/components/MagicBaker";
import "./ChatDrawer.css";

const starterQuestions = [
  "Bakes under Rs 1,000?",
  "Tell me about gift boxes",
  "How much is a custom box?",
];

export default function ChatDrawer({ open, onClose }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [voiceProblem, setVoiceProblem] = useState(false);
  const [mode, setMode] = useState("help");
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const sessionId = useRef(window.crypto?.randomUUID?.() || `pip-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const recognitionRef = useRef(null);
  const recordingRef = useRef(null);
  const voiceStartingRef = useRef(false);
  const voiceRequestRef = useRef(null);
  const openRef = useRef(open);
  openRef.current = open;
  const voiceSubmissionRef = useRef(false);
  const speechRef = useRef(null);
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);
  const [chat, setChat] = useState([
    { role: "assistant", text: "Hi, I'm Pippa! I can help you find a bake, check menu prices, or look up an order. What can I help with?" },
  ]);

  const stopRecording = (cancel = false) => {
    const recording = recordingRef.current;
    if (!recording) return;
    recording.cancelled = cancel;
    window.clearTimeout(recording.timer);
    if (recording.recorder.state !== "inactive") recording.recorder.stop();
    recording.stream.getTracks().forEach((track) => track.stop());
  };

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat, loading]);

  useEffect(() => {
    if (!open) {
      recognitionRef.current?.abort();
      stopRecording(true);
      voiceRequestRef.current?.abort();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      setListening(false);
      setTranscribing(false);
      setSpeaking(false);
    }
  }, [open]);

  useEffect(() => () => {
    openRef.current = false;
    recognitionRef.current?.abort();
    stopRecording(true);
    voiceRequestRef.current?.abort();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const speak = (text) => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setError("Spoken replies aren't available in this browser. You can still read Pippa's messages here.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.94;
    utterance.pitch = 1.12;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const speakLatestReply = () => {
    const latestReply = [...chat].reverse().find((turn) => turn.role === "assistant");
    if (latestReply) speak(latestReply.text);
  };

  const toggleVoiceReplies = () => {
    setVoiceReplies((enabled) => {
      if (enabled && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
      }
      return !enabled;
    });
  };

  const startBrowserListening = async () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Voice input isn't supported by this browser. Type your question instead.");
      return;
    }
    setError("");
    setVoiceProblem(false);
    voiceSubmissionRef.current = false;

    let processLocally = false;
    if (typeof Recognition.available === "function" && typeof Recognition.install === "function") {
      try {
        const availability = await Recognition.available({ langs: ["en-US"], processLocally: true });
        if (availability === "available") {
          processLocally = true;
        } else if (availability === "downloadable" || availability === "downloading") {
          setError("Preparing Pippa’s offline voice pack…");
          const installed = await Recognition.install({ langs: ["en-US"] });
          setError("");
          processLocally = installed;
        }
      } catch {
        processLocally = false;
        setError("");
      }
    }

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    if ("processLocally" in recognition) recognition.processLocally = processLocally;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      if (voiceSubmissionRef.current) return;
      const finalResult = Array.from(event.results || []).find((result) => result.isFinal) || event.results?.[0];
      const transcript = finalResult?.[0]?.transcript?.trim();
      if (transcript) {
        voiceSubmissionRef.current = true;
        recognition.stop();
        setMessage(transcript.slice(0, 1000));
        inputRef.current?.focus();
      }
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === "aborted") return;
      const messages = {
        "not-allowed": "Microphone access is blocked. Allow it for this page in your browser settings, then try again.",
        "service-not-allowed": "This browser or embedded editor blocks its speech service. Try opening the site in Chrome, or use macOS Dictation in the message field.",
        "no-speech": "I didn't hear speech. Tap the mic, wait for the listening state, then speak clearly; you can also use macOS Dictation in the message field.",
        "audio-capture": "No microphone was found. Connect or enable a microphone, or type your question.",
        network: "The browser speech service couldn't connect, and offline English speech isn't available here. Try Chrome, or enable Dictation in System Settings → Keyboard, then dictate into this message field. Pippa's text chat is still available.",
        "language-not-supported": "Voice recognition doesn't support English on this browser. Type your question instead.",
      };
      setVoiceProblem(true);
      setError(messages[event.error] || `Voice input stopped (${event.error || "unknown reason"}). Try again or type your question.`);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setListening(false);
      setError("The microphone is busy. Try again in a moment.");
    }
  };

  const startListening = async () => {
    if (voiceStartingRef.current || recordingRef.current || transcribing || loading) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      return startBrowserListening();
    }
    voiceStartingRef.current = true;
    setError("");
    setVoiceProblem(false);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (!openRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find((type) => window.MediaRecorder.isTypeSupported(type));
      const recorder = new window.MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const recording = { recorder, stream, chunks: [], cancelled: false, timer: undefined };
      recordingRef.current = recording;
      recorder.ondataavailable = (event) => {
        if (event.data.size) recording.chunks.push(event.data);
      };
      recorder.onerror = () => {
        stopRecording(true);
        setListening(false);
        setVoiceProblem(true);
        setError("The microphone recording failed. Please try again.");
      };
      recorder.onstop = async () => {
        window.clearTimeout(recording.timer);
        recording.stream.getTracks().forEach((track) => track.stop());
        if (recordingRef.current === recording) recordingRef.current = null;
        if (recording.cancelled || !openRef.current) return;
        setListening(false);
        setTranscribing(true);
        const controller = new AbortController();
        voiceRequestRef.current = controller;
        try {
          const audio = new Blob(recording.chunks, { type: recorder.mimeType || mimeType || "audio/webm" });
          const response = await api.post("/speech/transcribe", audio, {
            headers: { "Content-Type": audio.type },
            signal: controller.signal,
            timeout: 180000,
          });
          const transcript = response.data.text?.trim();
          if (controller.signal.aborted || !openRef.current) return;
          if (!transcript) throw new Error("No speech was detected. Please try again.");
          setTranscribing(false);
          setMessage(transcript.slice(0, 1000));
          inputRef.current?.focus();
        } catch (failure) {
          if (!controller.signal.aborted && openRef.current) {
            setVoiceProblem(true);
            setError(failure.response?.data?.detail || "Pippa couldn't transcribe the recording. Check the kitchen server connection and try again.");
          }
        } finally {
          if (voiceRequestRef.current === controller) {
            voiceRequestRef.current = null;
            setTranscribing(false);
          }
        }
      };
      recorder.start();
      setListening(true);
      recording.timer = window.setTimeout(() => stopRecording(), 15000);
    } catch (failure) {
      stream?.getTracks().forEach((track) => track.stop());
      recordingRef.current = null;
      setListening(false);
      setVoiceProblem(true);
      const permissionBlocked = failure.name === "NotAllowedError" || failure.name === "SecurityError";
      setError(permissionBlocked
        ? "Microphone access is blocked. Allow microphone access for this page, then try again."
        : "No microphone is available. Connect a microphone and try again.");
    } finally {
      voiceStartingRef.current = false;
    }
  };

  const send = async (draft = message) => {
    if (!draft.trim() || loading) return;
    const text = draft.trim();
    setMessage("");
    const history = chat.slice(-10).map(({ role, text: turnText }) => ({ role, text: turnText }));
    setChat((c) => [...c, { role: "user", text }]);
    setError("");
    setLoading(true);
    try {
      const r = await api.post("/chat", { message: text, session_id: sessionId.current, history });
      setChat((c) => [...c, { role: "assistant", text: r.data.reply }]);
      setMode(r.data.mode || "help");
      if (voiceReplies) speak(r.data.reply);
    } catch {
      setError("Pippa couldn't reach the kitchen just now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <section className="chat-drawer" role="dialog" aria-modal="false" aria-labelledby="baker-chat-title" data-testid="baker-chat-drawer">
      <header className="chat-header">
        <div className="chat-header-copy">
          <div className="chat-title-line"><b id="baker-chat-title">Pippa, your pocket baker</b><span className="chat-live-badge"><i /> LIVE</span></div>
          <span className="chat-subtitle">Here for menu, bake & order questions</span>
          <span className="chat-mode">{mode === "ai" ? <><Sparkles size={12} /> AI baker online</> : mode === "order" ? "Secure order help" : "Kitchen helper online"}</span>
        </div>
        <button className={`chat-voice-toggle${voiceReplies ? " active" : ""}`} onClick={toggleVoiceReplies} aria-pressed={voiceReplies} aria-label={voiceReplies ? "Turn voice replies off" : "Turn voice replies on"} title={voiceReplies ? "Voice replies on" : "Voice replies off"} data-testid="chat-voice-toggle">
          {voiceReplies ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>
        <button className="chat-close" onClick={onClose} aria-label="Close baker chat" title="Close chat" data-testid="close-baker-chat"><X size={19} /></button>
      </header>
      <div className="chat-pip-scene">
        <MagicBaker context="chat" onActivate={speakLatestReply} speaking={speaking} />
      </div>
      <div className="chat-messages" aria-live="polite" aria-relevant="additions text">
        {chat.map((m, i) => (
          <div className={`chat-bubble ${m.role}`} key={i} data-testid={`chat-message-${i}`}>{m.text}</div>
        ))}
        {chat.length === 1 && !loading && (
          <div className="chat-starters" aria-label="Suggested questions">
            {starterQuestions.map((question) => (
              <button type="button" key={question} onClick={() => send(question)}>{question}</button>
            ))}
          </div>
        )}
        {loading && <div className="chat-bubble assistant chat-typing" role="status" data-testid="chat-loading"><span /> <span /> <span /><b>Pippa is checking the kitchen…</b></div>}
        <div ref={messagesEnd} />
      </div>
      {error && <div className="chat-error" role="alert" data-testid="chat-error">{error}</div>}
      {(listening || transcribing) && <div className="chat-voice-status" role="status" data-testid="chat-voice-status">{transcribing ? "Transcribing your question..." : "Listening... tap the microphone to finish."}</div>}
      {error && voiceProblem && (
        <div className="chat-voice-recovery">
          <button type="button" onClick={startListening}>Try microphone again</button>
          <button type="button" onClick={() => inputRef.current?.focus()}>Type instead</button>
        </div>
      )}
      <form className="chat-input" onSubmit={(event) => { event.preventDefault(); send(); }}>
        <input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
          aria-label="Message Pippa the baker"
          placeholder="Ask Pippa anything…"
          data-testid="baker-chat-input"
        />
        <button type="button" className={`chat-mic-button${listening ? " listening" : ""}`} onClick={listening ? () => { stopRecording(); recognitionRef.current?.stop(); } : startListening} disabled={loading || transcribing} aria-label={listening ? "Stop listening" : "Ask Pippa by voice"} title={listening ? "Stop listening" : "Ask Pippa by voice"} data-testid="chat-voice-input">
          {listening ? <MicOff size={17} /> : <Mic size={17} />}
        </button>
        <button type="submit" disabled={!message.trim() || loading} aria-label="Send message" title="Send message" data-testid="send-baker-chat"><ArrowUp size={18} /></button>
      </form>
      <div className="chat-footer">
        <span>Need a person?</span>
        <button
          className="whatsapp-button"
          onClick={() => window.open(waLink("Hello Treats & Temptation by SK! I have a question about a bake/order."), "_blank", "noopener,noreferrer")}
          data-testid="chat-whatsapp-order"
        >
          Ask Sana <MessageCircle size={14} />
        </button>
      </div>
    </section>
  );
}
