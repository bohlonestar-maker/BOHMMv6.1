import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm the BOH AI Assistant. Ask me anything about Brothers of the Highway TC - bylaws, prospects, meetings, chain of command, and more!"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API}/chat`,
        { message: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Add bot response to chat
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: response.data.response }
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button - Responsive positioning */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-all hover:scale-110"
          aria-label="Open chat"
        >
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Chat Window - Responsive sizing and positioning */}
      {isOpen && (
        <div 
          className={`
            fixed z-40
            ${/* Mobile: Full screen */ ''}
            inset-0 sm:inset-auto
            ${/* Tablet & Desktop: Positioned bottom-right */ ''}
            sm:bottom-20 sm:right-6
            ${/* Responsive width */ ''}
            w-full sm:w-96 md:w-[420px] lg:w-[450px]
            ${/* Responsive height */ ''}
            h-full sm:h-[500px] md:h-[550px] lg:h-[600px]
            ${/* Styling */ ''}
            bg-slate-800 border-0 sm:border sm:border-slate-700 
            rounded-none sm:rounded-lg shadow-2xl 
            flex flex-col
          `}
        >
          {/* Header - Responsive padding */}
          <div className="bg-blue-600 text-white p-3 sm:p-4 rounded-t-none sm:rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-semibold text-sm sm:text-base">BOH AI Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Messages - Responsive padding and spacing */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    max-w-[85%] sm:max-w-[80%]
                    rounded-lg p-2.5 sm:p-3
                    ${msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-100"
                    }
                  `}
                >
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 text-slate-100 rounded-lg p-2.5 sm:p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input - Responsive padding and sizing */}
          <div className="p-3 sm:p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Ask about BOH..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1 bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 text-sm sm:text-base h-10 sm:h-9"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 h-10 sm:h-9 px-3 sm:px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
