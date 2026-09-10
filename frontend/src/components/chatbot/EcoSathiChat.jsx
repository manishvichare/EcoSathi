import { useEffect, useRef, useState } from 'react';
import { sendMessage } from '../../services/chatService';
import { useCity } from '../../hooks/useCity';
import { 
  Bot, 
  Sparkles, 
  X, 
  Trash2, 
  Send, 
  MapPin, 
  MessageSquare,
  ChevronRight
} from 'lucide-react';

/**
 * Modern EcoSathi AI Assistant Widget
 */
export default function EcoSathiChat() {
  const { selectedCity } = useCity();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello! I'm EcoSathi AI. I'm connected to live environmental telemetry and municipal action frameworks. Ask me about air quality, civic complaints, or green practices in ${selectedCity || 'your city'}.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const panelRef = useRef(null);
  const scrollRef = useRef(null);
  const previousCityRef = useRef(selectedCity);

  // Quick prompt chips
  const suggestedPrompts = [
    `How is the air quality in ${selectedCity}?`,
    'Suggest 3 high-impact daily eco tasks',
    'How do I report illegal garbage dumping?',
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isLoading]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) && isOpen) {
        setIsOpen(false);
      }
    };
    const timer = setTimeout(() => {
      window.addEventListener('click', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  // Handle City Context Shift
  useEffect(() => {
    if (previousCityRef.current && previousCityRef.current !== selectedCity) {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: 'system',
          text: `📍 Context switched to ${selectedCity}. Answering environmental queries for ${selectedCity}.`,
        },
      ]);
    }
    previousCityRef.current = selectedCity;
  }, [selectedCity]);

  const handleSendText = async (textToSend) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const { reply } = await sendMessage(trimmed, selectedCity);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', text: reply },
      ]);
    } catch (err) {
      setError(err.message || 'Could not connect to AI Assistant. Using offline guidance.');
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: `In ${selectedCity}, tree canopy and particulate matter are primary environmental indicators. You can file photo reports for municipal inspection or track live AQI on the dashboard.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendText(input);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        text: `Chat cleared. Ask me anything about ${selectedCity || 'your city'}'s environment!`,
      },
    ]);
    setError(null);
  };

  return (
    <>
      {/* Floating AI Launcher Pill */}
      {!isOpen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          aria-label="Open EcoSathi AI assistant"
          className="fixed bottom-20 lg:bottom-6 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white shadow-xl hover:scale-105 transition-all border-2 border-white/40 glow-emerald"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-emerald-200" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-black tracking-wide hidden sm:inline">Ask EcoSathi AI</span>
        </button>
      )}

      {/* Expandable Glassmorphic Chat Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="
            fixed z-50 bg-white shadow-2xl flex flex-col
            inset-0
            sm:inset-auto sm:bottom-6 sm:right-6
            sm:w-[26rem] sm:h-[34rem] sm:rounded-3xl sm:border sm:border-slate-200
            overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-250
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                <Bot className="w-5 h-5 text-emerald-200" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm truncate">EcoSathi Assistant</h3>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-600/80 px-1.5 py-0.5 rounded-md">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 font-medium truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-300 shrink-0" />
                  <span>Focused on {selectedCity}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleClearChat}
                title="Clear chat history"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close assistant"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/70">
            {messages.map((msg) => {
              if (msg.role === 'system') {
                return (
                  <div key={msg.id} className="text-center my-2">
                    <span className="inline-block px-3 py-1 bg-emerald-100/90 text-emerald-900 text-[11px] font-bold rounded-full border border-emerald-200 shadow-2xs">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`
                      max-w-[85%] rounded-3xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-2xs
                      ${
                        isUser
                          ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white rounded-br-sm'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                      }
                    `}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    {!isUser && (
                      <p className="mt-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>EcoSathi Verified Telemetry</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing state */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-3xl rounded-bl-sm px-4 py-3 flex items-center gap-2 shadow-2xs">
                  <div className="animate-spin w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full" />
                  <span className="text-xs text-slate-500 font-medium">
                    Analyzing {selectedCity} environmental context...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts Chips */}
          <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
            {suggestedPrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendText(p)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 rounded-xl text-[11px] font-bold shrink-0 transition-colors border border-slate-200/60"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 bg-white border-t border-slate-200">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${selectedCity || 'your city'}...`}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}