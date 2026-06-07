import { useState, useRef, useEffect } from "react";

const MODES = ["Chat Tutor", "Quiz Me", "Flashcards", "Summarize"];

const modeIcons = {
  "Chat Tutor": "💬",
  "Quiz Me": "🧠",
  "Flashcards": "🃏",
  "Summarize": "📋",
};

const systemPrompts = {
  "Chat Tutor": `You are an expert, friendly study tutor. Answer the student's questions clearly and concisely. Use examples, analogies, and breakdowns to explain concepts. Keep responses focused and educational. Format with markdown when helpful.`,
  "Quiz Me": `You are a quiz master. When the student gives you a topic, generate 3 multiple-choice questions (A/B/C/D) one at a time. After the student answers, tell them if they're right or wrong and explain why. Then ask if they want the next question. Keep it engaging and encouraging.`,
  "Flashcards": `You are a flashcard generator. When the student gives you a topic or pastes notes, generate 5 clean flashcards in this exact JSON format and nothing else:
[{"front": "Question or term", "back": "Answer or definition"}, ...]
No extra text, just valid JSON array.`,
  "Summarize": `You are a summarization expert. When the student pastes text or gives a topic, provide a crisp, structured summary with: 1) Key Concepts (bullet points), 2) Main Takeaways (2-3 sentences), 3) Remember This (one golden rule or insight). Keep it scannable and student-friendly.`,
};

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "10px 0" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#a78bfa",
            animation: "bounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }`}</style>
    </div>
  );
}

function FlashcardView({ cards }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState([]);

  if (!cards.length) return null;
  const card = cards[index];
  const progress = Math.round((known.length / cards.length) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "8px 0" }}>
      <div style={{ fontSize: 13, color: "#94a3b8" }}>
        Card {index + 1} of {cards.length} • {known.length} known ({progress}%)
      </div>
      <div
        onClick={() => setFlipped(!flipped)}
        style={{
          width: "100%", maxWidth: 420, minHeight: 160,
          background: flipped
            ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
            : "linear-gradient(135deg, #1e1b4b, #312e81)",
          borderRadius: 16, padding: 28, cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          border: "1px solid #4338ca",
          boxShadow: "0 8px 32px rgba(79,70,229,0.3)",
          transition: "all 0.3s ease",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#a78bfa", marginBottom: 12, textTransform: "uppercase" }}>
          {flipped ? "Answer" : "Question"}
        </div>
        <div style={{ fontSize: 17, color: "#f1f5f9", fontFamily: "'Georgia', serif", lineHeight: 1.5 }}>
          {flipped ? card.back : card.front}
        </div>
        <div style={{ fontSize: 11, color: "#6366f1", marginTop: 14 }}>
          {flipped ? "Tap to see question" : "Tap to reveal answer"}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {flipped && (
          <>
            <button
              onClick={() => { setKnown([...new Set([...known, index])]); setIndex((index + 1) % cards.length); setFlipped(false); }}
              style={{ padding: "8px 20px", background: "#059669", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
            >✓ Got it</button>
            <button
              onClick={() => { setKnown(known.filter(k => k !== index)); setIndex((index + 1) % cards.length); setFlipped(false); }}
              style={{ padding: "8px 20px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
            >✗ Review again</button>
          </>
        )}
        {!flipped && (
          <>
            <button
              onClick={() => setIndex((index - 1 + cards.length) % cards.length)}
              style={{ padding: "8px 16px", background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
            >← Prev</button>
            <button
              onClick={() => { setIndex((index + 1) % cards.length); setFlipped(false); }}
              style={{ padding: "8px 16px", background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
            >Next →</button>
          </>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";

  if (msg.type === "flashcards" && msg.cards) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>🃏 Flashcards generated</div>
        <FlashcardView cards={msg.cards} />
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 14,
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #a78bfa)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, flexShrink: 0, marginRight: 8, marginTop: 2,
        }}>🤖</div>
      )}
      <div style={{
        maxWidth: "78%",
        background: isUser
          ? "linear-gradient(135deg, #4f46e5, #6d28d9)"
          : "#1e293b",
        color: isUser ? "#fff" : "#e2e8f0",
        padding: "11px 16px",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        fontSize: 14, lineHeight: 1.65,
        border: isUser ? "none" : "1px solid #334155",
        whiteSpace: "pre-wrap",
      }}>
        {msg.content}
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("Chat Tutor");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hey! 👋 I'm your AI Study Buddy. Pick a mode above and let's get learning. What subject are we tackling today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setMessages([
      {
        role: "assistant",
        content: `Switched to **${newMode}** mode! ${
          newMode === "Chat Tutor" ? "Ask me anything about any subject." :
          newMode === "Quiz Me" ? "Tell me a topic and I'll quiz you with multiple-choice questions!" :
          newMode === "Flashcards" ? "Give me a topic or paste your notes, and I'll generate flashcards for you." :
          "Paste text or give me a topic and I'll summarize it clearly."
        }`,
      },
    ]);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    if (!topic) setTopic(input.trim().slice(0, 40));
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = newMessages
        .filter(m => !m.type)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompts[mode],
          messages: apiMessages,
        }),
      });

      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "Sorry, I couldn't respond.";

      if (mode === "Flashcards") {
        try {
          const clean = text.replace(/```json|```/g, "").trim();
          const cards = JSON.parse(clean);
          setMessages(prev => [...prev, { role: "assistant", type: "flashcards", cards, content: text }]);
        } catch {
          setMessages(prev => [...prev, { role: "assistant", content: text }]);
        }
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: text }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a0a1a 0%, #0f0f2e 50%, #0a0a1a 100%)",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "20px 12px 0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        textarea:focus, input:focus { outline: none; }
        textarea { resize: none; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 32, marginBottom: 6 }}>📚</div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 26, fontWeight: 700,
          background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          margin: 0,
        }}>AI Study Buddy</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>Your personal AI-powered tutor</p>
      </div>

      {/* Mode Switcher */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 16,
        background: "#0f172a", padding: 5, borderRadius: 12,
        border: "1px solid #1e293b", flexWrap: "wrap", justifyContent: "center",
      }}>
        {MODES.map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              padding: "7px 14px", borderRadius: 8, border: "none",
              cursor: "pointer", fontSize: 13, fontWeight: 500,
              background: mode === m
                ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                : "transparent",
              color: mode === m ? "#fff" : "#64748b",
              transition: "all 0.2s",
            }}
          >
            {modeIcons[m]} {m}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div style={{
        width: "100%", maxWidth: 680,
        background: "#0d1117",
        border: "1px solid #1e293b",
        borderRadius: 20, flex: 1,
        display: "flex", flexDirection: "column",
        height: "calc(100vh - 230px)", maxHeight: 520,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 8px" }}>
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤖</div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "16px 16px 16px 4px", padding: "8px 16px" }}>
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "12px 14px",
          borderTop: "1px solid #1e293b",
          display: "flex", gap: 8, alignItems: "flex-end",
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={
              mode === "Chat Tutor" ? "Ask me anything... (e.g. Explain photosynthesis)" :
              mode === "Quiz Me" ? "Enter a topic to get quizzed on..." :
              mode === "Flashcards" ? "Enter a topic or paste your notes..." :
              "Paste text or enter a topic to summarize..."
            }
            rows={2}
            style={{
              flex: 1, background: "#1e293b", color: "#e2e8f0",
              border: "1px solid #334155", borderRadius: 12,
              padding: "10px 14px", fontSize: 14, lineHeight: 1.5,
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              width: 42, height: 42,
              background: loading || !input.trim()
                ? "#1e293b"
                : "linear-gradient(135deg, #4f46e5, #7c3aed)",
              border: "none", borderRadius: 12,
              cursor: loading || !input.trim() ? "default" : "pointer",
              fontSize: 18, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", flexShrink: 0,
            }}
          >→</button>
        </div>
      </div>

      <p style={{ color: "#1e293b", fontSize: 11, margin: "10px 0", textAlign: "center" }}>
        Powered by Claude AI
      </p>
    </div>
  );
}
