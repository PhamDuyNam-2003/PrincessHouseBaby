'use client';

import { useState, useRef, useEffect } from 'react';

type Message = {
  role: 'user' | 'model';
  text: string;
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Chuẩn bị history cho Gemini
      const history = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'model', text: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'model', text: 'Xin lỗi, tôi không thể trả lời lúc này 🥲' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Lỗi kết nối, vui lòng thử lại nhé! 😢' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Nút chat nổi */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-[9999] w-16 h-16 rounded-full shadow-[0_8px_30px_rgba(236,72,153,0.4)] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_12px_40px_rgba(236,72,153,0.5)] active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #ec4899, #a855f7)',
        }}
        aria-label="Mở chatbot tư vấn"
      >
        {open ? (
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
            <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
          </svg>
        )}

        {/* Hiệu ứng nhấp nháy khi chưa mở */}
        {!open && messages.length === 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
        )}
      </button>

      {/* Tooltip nhỏ */}
      {!open && messages.length === 0 && (
        <div className="fixed bottom-[5.5rem] right-6 z-[9998] bg-white text-pink-600 text-sm font-bold px-4 py-2 rounded-2xl shadow-lg border border-pink-100 animate-bounce pointer-events-none">
          Chat với Princess Bot 🎀
          <div className="absolute bottom-0 right-6 translate-y-1/2 rotate-45 w-3 h-3 bg-white border-r border-b border-pink-100" />
        </div>
      )}

      {/* Popup Chat */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-[9998] w-[380px] max-w-[calc(100vw-2rem)] rounded-3xl shadow-[0_20px_60px_rgba(236,72,153,0.25)] overflow-hidden flex flex-col border border-pink-100"
          style={{
            height: 'min(520px, calc(100vh - 8rem))',
            background: '#fff',
          }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 flex items-center gap-3 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #ec4899, #a855f7)',
            }}
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl backdrop-blur-sm">
              🎀
            </div>
            <div className="flex-1">
              <h3 className="text-white font-extrabold text-base leading-tight">
                Princess Bot
              </h3>
              <p className="text-white/80 text-xs font-medium">
                Tư vấn kẹp tóc & phụ kiện ✨
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors backdrop-blur-sm"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-pink-50/50 to-white">
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">👑</div>
                <p className="text-pink-500 font-bold text-base mb-1">
                  Chào bạn! 🌸
                </p>
                <p className="text-gray-400 text-sm">
                  Tôi là Princess Bot, hỏi tôi bất cứ điều gì về kẹp tóc nhé!
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {['Có kẹp tóc nào đẹp?', 'Giá bao nhiêu?', 'Tư vấn cho bé 5 tuổi'].map(
                    (q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setInput(q);
                          setTimeout(() => {
                            setInput('');
                            const userMsg: Message = { role: 'user', text: q };
                            setMessages([userMsg]);
                            setLoading(true);
                            fetch('/api/chat', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ message: q, history: [] }),
                            })
                              .then((r) => r.json())
                              .then((data) => {
                                setMessages((prev) => [
                                  ...prev,
                                  {
                                    role: 'model',
                                    text: data.reply || 'Xin lỗi, tôi không thể trả lời lúc này 🥲',
                                  },
                                ]);
                              })
                              .catch(() => {
                                setMessages((prev) => [
                                  ...prev,
                                  { role: 'model', text: 'Lỗi kết nối 😢' },
                                ]);
                              })
                              .finally(() => setLoading(false));
                          }, 0);
                        }}
                        className="px-3 py-1.5 bg-white border-2 border-pink-200 rounded-full text-xs font-bold text-pink-500 hover:bg-pink-50 hover:border-pink-300 transition-all active:scale-95"
                      >
                        {q}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-1 shadow-sm">
                    🎀
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white rounded-br-md'
                      : 'bg-white text-gray-700 rounded-bl-md border border-pink-50'
                  }`}
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-xs mr-2 flex-shrink-0 shadow-sm">
                  🎀
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md border border-pink-50 shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-pink-50 bg-white flex-shrink-0">
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi về kẹp tóc, giá cả..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-pink-50/70 border-2 border-pink-100 rounded-full text-sm focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all placeholder:text-pink-300 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 shadow-md hover:shadow-lg disabled:shadow-none"
                style={{
                  background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                }}
              >
                <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
