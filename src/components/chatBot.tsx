import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot } from "lucide-react";
import { chatbotService } from "../services/chatbotService";
import ReactMarkdown from 'react-markdown';

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Dùng ID của phiên làm việc (vd: lấy từ user login)
  const sessionId = "session_test_01"; 
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Kéo lịch sử chat khi mở popup
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsLoading(true);
      chatbotService.getChatHistory(sessionId).then(data => {
        if (data.length > 0) {
          setMessages(data);
        } else {
          setMessages([{ role: "assistant", content: "Xin chào! Tôi là trợ lý AI của HotelPro. Tôi có thể giúp gì cho bạn?" }]);
        }
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setMessages(prev => [...prev, { role: "user", content: userText }]);
    setInput("");
    setIsLoading(true);

    // Gọi service xử lý
    const reply = await chatbotService.sendMessage(userText, sessionId);
    
    setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-[500px] shadow-2xl rounded-xl bg-white flex flex-col overflow-hidden transition-all duration-300 border border-gray-200">
          
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 font-semibold text-lg flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2"><Bot size={20} /> HotelPro Assistant</div>
            <button onClick={() => setIsOpen(false)} className="hover:text-gray-200"><X size={20} /></button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                  msg.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
                }`}>
                  
                  {/* Trình xử lý Markdown an toàn */}
                  {/* Trình xử lý Markdown an toàn */}
                  {msg.role === "assistant" ? (
                    <div className="flex flex-col gap-2"> {/* Chuyển className lên đây */}
                      <ReactMarkdown 
                        components={{
                          ul: (props) => <ul className="list-disc ml-5 space-y-1" {...props} />,
                          ol: (props) => <ol className="list-decimal ml-5 space-y-1" {...props} />,
                          p: (props) => <p className="m-0 leading-relaxed" {...props} />,
                          strong: (props) => <strong className="font-semibold text-gray-900" {...props} />
                        }}
                      >
                        {String(msg.content || "")}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap leading-relaxed">{msg.content}</span>
                  )}

                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="p-3 rounded-2xl bg-white border border-gray-100 text-gray-800 text-sm animate-pulse rounded-bl-sm shadow-sm">
                  AI đang xử lý...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Nhập yêu cầu..."
              className="flex-1 p-2 border border-gray-300 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button onClick={handleSend} disabled={isLoading} className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button onClick={() => setIsOpen(!isOpen)} className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 transition-all">
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}