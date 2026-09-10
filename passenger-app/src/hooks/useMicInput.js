import { useRef, useCallback, useEffect } from "react";
import { useMotionValue } from "motion/react";
import { useAppStore } from "../store/appStore.js";
import { speechToText } from "../lib/railsenseApi.js";

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Manages microphone input + AudioContext amplitude analysis.
 * Returns a MotionValue for amplitude — never useState for continuous values.
 * All animation consumers use useTransform(amplitude, ...) directly.
 */
export function useMicInput({ onTranscript } = {}) {
  const amplitude = useMotionValue(0);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
  const langRef = useRef("en");
  const silenceStartedAtRef = useRef(null);
  const captureStartedAtRef = useRef(0);

  const setMicState = useAppStore((s) => s.setMicState);
  const micState = useAppStore((s) => s.micState);

  const stopAll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      setMicState("processing");
      try { recorderRef.current.stop(); } catch (_) {}
      return;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    amplitude.set(0);
    setMicState("idle");
  }, [amplitude, setMicState]);

  const startListening = useCallback(async (lang = "en") => {
    // Immediate visual feedback on pointer-down before permission resolves
    setMicState("requesting");

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMicState("denied");
      return;
    }

    streamRef.current = stream;
    setMicState("active");
    langRef.current = lang;
    transcriptRef.current = "";
    silenceStartedAtRef.current = null;
    captureStartedAtRef.current = Date.now();

    // Audio analysis loop — drives MotionValue, never React state
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);

    function tick() {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += Math.abs(data[i] - 128);
      }
      const avg = sum / data.length;
      amplitude.set(avg * 2); // scale to roughly 0-255
      if (avg > 5) {
        silenceStartedAtRef.current = null;
      } else if (!silenceStartedAtRef.current) {
        silenceStartedAtRef.current = Date.now();
      } else if (
        Date.now() - captureStartedAtRef.current > 900 &&
        Date.now() - silenceStartedAtRef.current > 1600 &&
        recorderRef.current?.state === "recording"
      ) {
        stopAll();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = ({ en: "en-IN", hi: "hi-IN", kn: "kn-IN", te: "te-IN", ta: "ta-IN" })[lang] || "en-IN";
      recognition.interimResults = false;
      recognition.continuous = true;
      recognition.onresult = (event) => {
        const text = Array.from(event.results)
          .map((result) => result[0]?.transcript || "")
          .join(" ")
          .trim();
        if (text) transcriptRef.current = text;
      };
      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (_) {}
    }

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || recorder.mimeType || "audio/webm" });
      let capturedTranscript = "";
      // Release the physical microphone before waiting on transcription.
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
      streamRef.current = null;
      audioCtxRef.current = null;
      amplitude.set(0);
      try {
        let transcript = transcriptRef.current;
        if (blob.size > 0) {
          try {
            const dataUrl = await blobToDataUrl(blob);
            const result = await speechToText(dataUrl, langRef.current);
            transcript = result.transcript || transcript;
          } catch (_) {
            // Browser speech recognition above remains a real fallback when Sarvam rejects browser audio.
          }
        }
        capturedTranscript = transcript;
        if (transcript && onTranscript) onTranscript(transcript);
        if (!transcript) setMicState("error");
      } catch (_) {
        setMicState("error");
      } finally {
        recorderRef.current = null;
        recognitionRef.current = null;
        setMicState(capturedTranscript ? "idle" : "error");
      }
    };
    recorder.start();
    recorderRef.current = recorder;
  }, [amplitude, setMicState, stopAll, onTranscript]);

  // Cleanup on unmount
  useEffect(() => () => stopAll(), [stopAll]);

  return { amplitude, micState, startListening, stopListening: stopAll };
}
