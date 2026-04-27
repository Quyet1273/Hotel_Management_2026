import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, Loader2 } from "lucide-react";
import { chatbotService } from "../services/chatbotService";
import ReactMarkdown from 'react-markdown';
import { toast } from "sonner";

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  
  // Dùng ID của phiên làm việc (vd: lấy từ user login)
  const sessionId = "session_test_01"; 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 1. Tạo một hàm để AI tự "khai hỏa"
const triggerAutoReport = async () => {
  const checkMsg = "Hệ thống: Hãy báo cáo tình hình nhận/trả phòng trong 2 tiếng tới.";
  
  // Gọi hàm sendMessage của chatbotService nhưng với một flag ẩn
  const report = await chatbotService.sendMessage(checkMsg, sessionId);
  
  // Đẩy tin nhắn của AI vào state để nó hiện lên màn hình
  setMessages(prev => [...prev, { role: 'assistant', content: report }]);
};

// 2. Tự động chạy khi đại ca mở máy
useEffect(() => {
  // Đợi 2 giây sau khi app load cho nó "thật"
  const timer = setTimeout(() => {
    if (messages.length === 0) { // Chỉ báo nếu chưa chat gì
      triggerAutoReport();
    }
  }, 2000);
  
  return () => clearTimeout(timer);
}, []);

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
  useEffect(() => {
  const autoCheckSchedule = async () => {
    // Chỉ tự động kiểm tra nếu đại ca đang KHÔNG mở khung chat
    // Để tránh việc đang chat mà nó nhảy tin nhắn rác
    if (!isOpen) {
      const autoMsg = "Hệ thống: Kiểm tra lịch nhận/trả phòng trong 1 tiếng tới.";
      const reply = await chatbotService.sendMessage(autoMsg, sessionId);

      // Nếu AI trả về có dữ liệu (không phải báo 'không có ca nào')
      if (reply && !reply.includes("không có ca nhận/trả phòng")) {
        setUnreadCount(prev => prev + 1);
        // Có thể thêm một cái toast nhẹ ở đây cho đại ca biết
        toast.info("AI HotelPro: Có lịch nhận/trả phòng cần chú ý!");
      }
    }
  };

  // Quét 10 phút/lần
  const timer = setInterval(autoCheckSchedule, 10 * 60 * 1000);
  return () => clearInterval(timer);
}, [isOpen, sessionId]);
return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* 1. Khung ChatBot */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-[550px] shadow-2xl rounded-2xl bg-white flex flex-col overflow-hidden transition-all duration-300 border border-gray-200 animate-in slide-in-from-bottom-5">
          
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 font-bold text-lg flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div>
                <p className="leading-none text-sm">HotelPro Assistant</p>
                <p className="text-[10px] text-blue-100 font-normal mt-1">Trợ lý vận hành AI</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setIsOpen(false);
                setUnreadCount(0); // Đóng lại là xóa thông báo
              }} 
              className="hover:bg-white/20 p-1 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area (Vùng hiển thị tin nhắn) */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-4">
            {messages.length === 0 && (
              <div className="text-center mt-20 space-y-2">
                <Bot size={40} className="mx-auto text-blue-200" />
                <p className="text-gray-400 text-xs italic">Chào đại ca Bùi Quỳnh! Em đã sẵn sàng hỗ trợ.</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                  msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-br-none" 
                  : "bg-white border border-blue-100 text-gray-800 rounded-bl-none"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown 
                        components={{
                          ul: (props) => <ul className="list-disc ml-4 space-y-1" {...props} />,
                          p: (props) => <p className="m-0 leading-relaxed" {...props} />,
                          strong: (props) => <strong className="font-bold text-blue-800" {...props} />
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
            
            {/* Loading (Khi AI đang suy nghĩ) */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="p-3 rounded-2xl bg-white border border-gray-100 text-blue-600 text-xs flex items-center gap-2 italic shadow-sm">
                  <Loader2 size={14} className="animate-spin" /> Đang soi dữ liệu...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area (Ô nhập liệu) */}
          <div className="p-3 border-t bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Hỏi về doanh thu, lịch hôm nay..."
              className="flex-1 p-2.5 border border-gray-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50"
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading}
              className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Nút Floating Button (Cái icon tròn ở góc) */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setUnreadCount(0); // Mở ra là reset số tin nhắn chưa đọc
        }}
        className="relative w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-110 transition-all group"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />}

        {/* CHẤM ĐỎ THÔNG BÁO - ĐIỂM CỘNG Ở ĐÂY NÀY ĐẠI CA */}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-lg">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}