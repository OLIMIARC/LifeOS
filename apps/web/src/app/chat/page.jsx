import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello. I am your business advisor. How can I help you understand your business reality today?",
    },
  ]);
  const scrollRef = useRef(null);

  const ownerId = "default_owner";
  const { data: business } = useQuery({
    queryKey: ["business", ownerId],
    queryFn: async () => {
      const res = await fetch(`/api/business?ownerId=${ownerId}`);
      return res.json();
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (msgs) => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, businessId: business.id }),
      });
      if (!res.ok) throw new Error("Chat failed");
      return res.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer },
      ]);
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending || !business) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    chatMutation.mutate(newMessages.slice(-5)); // Send last 5 for context
  };

  const suggestions = [
    "Why is my profit down?",
    "Which items make the most money?",
    "What should I stop buying?",
    "Best performing day?",
  ];

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex items-center gap-2">
        <Sparkles className="text-indigo-600" size={20} />
        <h2 className="text-2xl font-bold text-slate-900">LifeOS Chat</h2>
      </div>

      <div
        className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        ref={scrollRef}
      >
        <div className="space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${msg.role === "assistant" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"}`}
              >
                {msg.role === "assistant" ? (
                  <Bot size={20} />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "assistant" ? "bg-slate-50 text-slate-900 border border-slate-100" : "bg-indigo-600 text-white shadow-md"}`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <Loader2 size={20} className="animate-spin" />
              </div>
              <div className="max-w-[80%] rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400">
                Analyzing your business data...
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {messages.length < 3 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(s);
                }}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your business anything..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-6 pr-16 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || chatMutation.isPending}
            className="absolute right-3 top-2 rounded-xl bg-indigo-600 p-2 text-white transition-colors hover:bg-indigo-700 disabled:bg-slate-300"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
