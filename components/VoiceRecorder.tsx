"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";

// Voice-to-Text RME: rekam suara dokter, kirim ke Groq Whisper untuk transkripsi.
export default function VoiceRecorder({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribe(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Tidak bisa akses mikrofon. Izinkan akses mikrofon di browser.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function transcribe(blob: Blob) {
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      const res = await fetch("/api/ai/transcribe", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) onTranscript(json.data.text);
      else setError(json.error?.message || "Gagal mentranskrip audio");
    } finally {
      setTranscribing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={recording ? "danger" : "ghost"}
        onClick={recording ? stopRecording : startRecording}
        disabled={transcribing}
        className="!px-3 !py-1.5 text-xs"
      >
        {transcribing ? "Mentranskrip..." : recording ? "⏹ Berhenti Rekam" : "🎤 Rekam Suara"}
      </Button>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
