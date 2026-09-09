import { useRef, useCallback, useEffect } from "react";
import { useMotionValue } from "motion/react";
import { useAppStore } from "../store/appStore.js";

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
  const recognitionRef = useRef(null);

  const setMicState = useAppStore((s) => s.setMicState);
  const micState = useAppStore((s) => s.micState);

  const stopAll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
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
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    // Web Speech API for transcript (TODO: replace with Sarvam STT)
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      const langMap = { en: "en-IN", hi: "hi-IN", kn: "kn-IN", te: "te-IN", ta: "ta-IN" };
      recognition.lang = langMap[lang] || "en-IN";
      recognition.onresult = (e) => {
        const transcript = e.results[0]?.[0]?.transcript || "";
        if (onTranscript) onTranscript(transcript);
      };
      recognition.onend = () => stopAll();
      recognition.onerror = () => stopAll();
      recognition.start();
      recognitionRef.current = recognition;
    }
  }, [amplitude, setMicState, stopAll, onTranscript]);

  // Cleanup on unmount
  useEffect(() => () => stopAll(), [stopAll]);

  return { amplitude, micState, startListening, stopListening: stopAll };
}
