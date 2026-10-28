import { useEffect, useRef, useState } from "react";
import { ArrowUp, Mic, MicOff, MessageCircle, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { api, waLink } from "@/state/api";
import { getLocalPippaReply } from "@/state/bakerBrain";
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

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    stopRecording(true);
    setListening(false);
    setTranscribing(false);
  };

  const startListening = () => {
    if (listening || loading) {
      stopListening();
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Voice input is supported in Chrome, Edge, and Safari. On mobile keyboards, you can tap the microphone icon on your keyboard to speak into this message field!");
      setVoiceProblem(true);
      return;
    }

    stopListening();
    setError("");
    setVoiceProblem(false);
    voiceSubmissionRef.current = false;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();

    try {
      const recognition = new Recognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setListening(true);
      };

      recognition.onresult = (event) => {
        if (voiceSubmissionRef.current) return;
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setMessage(transcript.slice(0, 1000));
        }

        const isFinal = event.results[event.results.length - 1]?.isFinal;
        if (isFinal && transcript.trim()) {
          voiceSubmissionRef.current = true;
          try {
            recognition.stop();
          } catch {}
          recognitionRef.current = null;
          setListening(false);
          send(transcript.trim());
        }
      };

      recognition.onerror = (event) => {
        setListening(false);
        recognitionRef.current = null;
        if (event.error === "aborted") return;
        if (event.error === "no-speech") {
          setError("I didn't hear speech. Tap the microphone and speak clearly.");
          setVoiceProblem(true);
          return;
        }
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setError("Microphone access is blocked. Allow microphone permission in your browser address bar, then try again.");
          setVoiceProblem(true);
          return;
        }
        setError(`Voice input paused (${event.error || "network"}). You can type your question or tap the mic to try again.`);
        setVoiceProblem(true);
      };

      recognition.onend = () => {
        setListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setListening(false);
      recognitionRef.current = null;
      setError("The microphone could not be started. Tap the mic to try again or type your question.");
      setVoiceProblem(true);
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
      const r = await api.post("/chat", { message: text, session_id: sessionId.current, history }, { timeout: 6000 });
      if (r?.data?.reply) {
        setChat((c) => [...c, { role: "assistant", text: r.data.reply }]);
        setMode(r.data.mode || "help");
        if (voiceReplies) speak(r.data.reply);
        return;
      }
    } catch {
      // Backend unavailable or error; use our local kitchen brain fallback seamlessly
    } finally {
      setLoading(false);
    }

    try {
      const localReply = getLocalPippaReply(text, history);
      setChat((c) => [...c, { role: "assistant", text: localReply }]);
      setMode("help");
      if (voiceReplies) speak(localReply);
    } catch {
      setError("Pippa is having a momentary hiccup. Message Sana directly on WhatsApp: +92 322 411 2832.");
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
      {(listening || transcribing) && <div className="chat-voice-status" role="status" data-testid="chat-voice-status">{transcribing ? "Processing your speech..." : "Listening... Speak your question ✨"}</div>}
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
        <button type="button" className={`chat-mic-button${listening ? " listening" : ""}`} onClick={listening ? stopListening : startListening} disabled={loading || transcribing} aria-label={listening ? "Stop listening" : "Ask Pippa by voice"} title={listening ? "Stop listening" : "Ask Pippa by voice"} data-testid="chat-voice-input">
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
