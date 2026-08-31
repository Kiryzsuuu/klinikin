"use client";

import { useEffect, useRef, useState, use } from "react";
import { Button, Card } from "@/components/ui";

const STUN_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }];

type SessionData = {
  offer: RTCSessionDescriptionInit | null;
  answer: RTCSessionDescriptionInit | null;
  callerCandidates: RTCIceCandidateInit[];
  calleeCandidates: RTCIceCandidateInit[];
  status: string;
};

export default function CallPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const roleRef = useRef<"caller" | "callee" | null>(null);
  const appliedCandidates = useRef(new Set<string>());

  const [status, setStatus] = useState("Menghubungkan...");
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      pcRef.current?.close();
    };
  }, []);

  async function join() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const remoteStream = new MediaStream();
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
      };

      const res = await fetch(`/api/calls/${roomId}`);
      const json = await res.json();
      const session: SessionData = json.data;

      pc.onicecandidate = async (event) => {
        if (!event.candidate || !roleRef.current) return;
        await fetch(`/api/calls/${roomId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "candidate", role: roleRef.current, candidate: event.candidate.toJSON() }),
        });
      };

      if (!session.offer) {
        roleRef.current = "caller";
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await fetch(`/api/calls/${roomId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "offer", offer }),
        });
        setStatus("Menunggu lawan bicara bergabung...");
      } else {
        roleRef.current = "callee";
        await pc.setRemoteDescription(new RTCSessionDescription(session.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await fetch(`/api/calls/${roomId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "answer", answer }),
        });
        setStatus("Tersambung");
      }

      setJoined(true);
      poll(pc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengakses kamera/mikrofon");
    }
  }

  function poll(pc: RTCPeerConnection) {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/calls/${roomId}`);
      const json = await res.json();
      const session: SessionData = json.data;

      if (roleRef.current === "caller" && session.answer && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(session.answer));
        setStatus("Tersambung");
      }

      const incoming = roleRef.current === "caller" ? session.calleeCandidates : session.callerCandidates;
      for (const c of incoming) {
        const key = JSON.stringify(c);
        if (!appliedCandidates.current.has(key)) {
          appliedCandidates.current.add(key);
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch {
            // kandidat mungkin belum valid sebelum remote description terpasang, aman diabaikan
          }
        }
      }

      if (session.status === "ENDED") {
        clearInterval(interval);
        setStatus("Panggilan berakhir");
      }
    }, 1500);
  }

  async function endCall() {
    pcRef.current?.close();
    await fetch(`/api/calls/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end" }),
    });
    setStatus("Panggilan berakhir");
    setJoined(false);
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6 bg-dark">
      <Card className="w-full max-w-3xl">
        <h1 className="text-xl font-semibold text-dark mb-1">Konsultasi Online</h1>
        <p className="text-dark/50 text-sm mb-4">Room: {roomId} — {status}</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full aspect-video bg-black rounded-2xl object-cover" />
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full aspect-video bg-black rounded-2xl object-cover" />
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {!joined ? (
          <Button onClick={join} className="w-full">
            Gabung Panggilan
          </Button>
        ) : (
          <Button onClick={endCall} variant="danger" className="w-full">
            Akhiri Panggilan
          </Button>
        )}
      </Card>
    </main>
  );
}
