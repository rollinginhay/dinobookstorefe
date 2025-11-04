'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const quickReplies = [
  'Gửi hàng như thế nào?',
  'Có được đổi trả không?',
  'Cách thanh toán?',
  'Khuyến mãi hiện tại?',
  'Sách mới nhất?',
];

// AI Response Generator (simulated)
const getAIResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase();
  
  if (message.includes('gửi hàng') || message.includes('vận chuyển') || message.includes('ship')) {
    return 'Chúng tôi giao hàng toàn quốc. Miễn phí ship cho đơn hàng từ 299.000₫. Thời gian giao hàng 2-5 ngày làm việc tùy khu vực. Bạn có muốn xem chi tiết phương thức vận chuyển không?';
  }
  
  if (message.includes('đổi trả') || message.includes('hoàn tiền') || message.includes('trả hàng')) {
    return 'Chúng tôi hỗ trợ đổi trả miễn phí trong 30 ngày. Sản phẩm phải còn nguyên vẹn, chưa sử dụng. Bạn có thể liên hệ hotline 1900-xxx-xxx hoặc email support@dinobook.com để được hỗ trợ.';
  }
  
  if (message.includes('thanh toán') || message.includes('payment') || message.includes('trả tiền')) {
    return 'Chúng tôi hỗ trợ nhiều hình thức thanh toán:\n• Thanh toán khi nhận hàng (COD)\n• Chuyển khoản ngân hàng\n• Thẻ tín dụng/ghi nợ\n• Ví điện tử (MoMo, ZaloPay)\n• Ví ShopeePay\nTất cả đều an toàn và bảo mật!';
  }
  
  if (message.includes('khuyến mãi') || message.includes('giảm giá') || message.includes('sale') || message.includes('deal')) {
    return 'Hiện tại chúng tôi đang có:\n🔥 Sale 11.11 - Giảm đến 50%\n🎁 Miễn phí ship cho đơn từ 299.000₫\n💰 Voucher 10K/20K cho đơn từ 120K/160K\n📚 Nhiều đầu sách đồng giá 110K\nBạn có muốn xem các sản phẩm đang giảm giá không?';
  }
  
  if (message.includes('sách mới') || message.includes('mới nhất') || message.includes('bestseller')) {
    return 'Chúng tôi có rất nhiều sách mới và bán chạy! Bạn có thể:\n📖 Xem sách trong nước mới nhất\n🌍 Xem sách nước ngoài mới nhất\n🔥 Xem top sách bán chạy\nBạn muốn xem danh mục nào?';
  }
  
  if (message.includes('giá') || message.includes('giá cả') || message.includes('rẻ')) {
    return 'Giá sách tại Dino Bookstore rất cạnh tranh với nhiều chương trình khuyến mãi. Chúng tôi có:\n• Sách đồng giá 110K\n• Giảm giá đến 50%\n• Miễn phí ship từ 299K\nBạn muốn tìm sách theo khoảng giá nào?';
  }
  
  if (message.includes('chào') || message.includes('hello') || message.includes('xin chào')) {
    return 'Xin chào! 👋 Tôi là trợ lý AI của Dino Bookstore. Tôi có thể giúp bạn:\n📚 Tìm kiếm sách\n🛒 Hướng dẫn mua hàng\n💳 Tư vấn thanh toán\n🚚 Thông tin giao hàng\n🔄 Chính sách đổi trả\nBạn cần hỗ trợ gì hôm nay?';
  }
  
  if (message.includes('cảm ơn') || message.includes('thanks') || message.includes('thank')) {
    return 'Không có gì! 😊 Rất vui được hỗ trợ bạn. Nếu có câu hỏi gì khác, đừng ngần ngại hỏi tôi nhé! Chúc bạn mua sắm vui vẻ!';
  }
  
  // Default response
  return 'Cảm ơn bạn đã liên hệ! Tôi hiểu bạn đang hỏi về "' + userMessage + '". Để được hỗ trợ tốt nhất, bạn có thể:\n📞 Gọi hotline: 1900-xxx-xxx\n📧 Email: support@dinobook.com\n💬 Chat với nhân viên trực tiếp\nHoặc bạn có thể cho tôi biết thêm chi tiết về câu hỏi của bạn không?';
};

export default function AIChatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! 👋 Tôi là trợ lý AI của Dino Bookstore. Tôi có thể giúp bạn tìm sách, tư vấn mua hàng, thông tin giao hàng và nhiều hơn nữa. Bạn cần hỗ trợ gì hôm nay?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when chatbox opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: getAIResponse(userMessage.text),
      sender: 'ai',
      timestamp: new Date(),
    };

    setIsTyping(false);
    setMessages(prev => [...prev, aiResponse]);
  };

  const handleQuickReply = (reply: string) => {
    setInputValue(reply);
    setTimeout(() => {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: reply,
        sender: 'user',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsTyping(true);

      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: getAIResponse(reply),
          sender: 'ai',
          timestamp: new Date(),
        };

        setIsTyping(false);
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 group"
        title="Chat với AI"
      >
        {isOpen ? (
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[600px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">AI Assistant</h3>
                <p className="text-xs text-purple-100">Trợ lý ảo Dino Bookstore</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-purple-100' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-2 shadow-sm border border-gray-200">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length === 1 && (
            <div className="px-4 py-2 bg-white border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Câu hỏi thường gặp:</p>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickReply(reply)}
                    className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

