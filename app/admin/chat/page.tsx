"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button, Card, Input } from "@/components/ui";

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
  });
  const [input, setInput] = useState("");

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-dark">✨ Asisten AI</h1>
        <p className="text-dark/60">Tanya seputar SOP, istilah medis, atau kode ICD-10. Bukan pengganti keputusan klinis dokter.</p>
      </div>

      <Card className="flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-2">
          {messages.length === 0 && (
            <p className="text-dark/40 text-sm text-center mt-8">Mulai percakapan dengan mengetik pertanyaan di bawah.</p>
          )}
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  message.role === "user" ? "bg-green text-white" : "bg-bg text-dark"
                }`}
              >
                {message.parts.map((part, i) => (part.type === "text" ? <span key={i}>{part.text}</span> : null))}
              </div>
            </div>
          ))}
          {status === "submitted" && <p className="text-dark/40 text-sm">Asisten sedang mengetik...</p>}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            sendMessage({ text: input });
            setInput("");
          }}
          className="flex gap-2 pt-4 border-t border-dark/10 mt-4"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik pertanyaan..."
            disabled={status !== "ready"}
          />
          <Button type="submit" disabled={status !== "ready"}>
            Kirim
          </Button>
        </form>
      </Card>
    </div>
  );
}
