"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import VoiceRecorder from "@/components/VoiceRecorder";
import ImageUpload from "@/components/ImageUpload";
import ReactMarkdown from "react-markdown";

type Message = {
  id?: number;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
};

type Conversation = {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function ChatPage() {
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/auth/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsAdmin(parsedUser.role === "admin");
      loadConversations(parsedUser.id);
    } catch (error) {
      console.error("Failed to parse user data:", error);
      router.push("/auth/login");
    }
  }, [router]);

  const loadConversations = async (userId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/chat/conversations/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
      setConversations([]);
    }
  };

  const loadConversation = async (conversationId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/chat/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        setCurrentConversationId(conversationId);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const createNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setInput("");
    setSelectedImage(null);
    setImagePreview(null);
  };

  const deleteConversation = async (conversationId: number) => {
    if (!confirm("Delete this conversation?")) return;

    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${API_URL}/chat/conversations/${conversationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (currentConversationId === conversationId) {
        createNewChat();
      }

      loadConversations(user.id);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { 
      role: "user", 
      content: selectedImage ? `[Image attached] ${input}` : input 
    };
    setMessages((prev) => [...prev, userMsg]);
    
    const currentInput = input;
    const currentImage = selectedImage;
    
    setInput("");
    setSelectedImage(null);
    setImagePreview(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      
      formData.append("message", currentInput);
      formData.append("user_id", user?.id.toString());
      if (currentConversationId) {
        formData.append("conversation_id", currentConversationId.toString());
      }
      if (currentImage) {
        formData.append("image", currentImage);
      }

      const response = await fetch(`${API_URL}/chat/message`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }

      const data = await response.json();
      const aiMsg: Message = {
        role: "assistant",
        content: data.response || "I'm here to help!",
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (!currentConversationId && data.conversation_id) {
        setCurrentConversationId(data.conversation_id);
        await loadConversations(user.id);
      } else if (currentConversationId) {
        await loadConversations(user.id);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscription = (text: string) => {
    setInput(text);
  };

  const handleImageSelected = (file: File, preview: string) => {
    setSelectedImage(file);
    setImagePreview(preview);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 overflow-hidden flex flex-col shadow-2xl`}
      >
        <div className="p-5 border-b border-gray-700/50">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg p-1">
              <Image 
                src="/arid-logo.png" 
                alt="Arid University Logo" 
                width={40} 
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold">Arid Assistant</h1>
              <p className="text-xs text-gray-400">AI-Powered Help</p>
            </div>
          </div>
          <button
            onClick={createNewChat}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-white py-3 px-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          <h2 className="text-xs text-gray-400 uppercase px-3 mb-3 font-semibold tracking-wider">
            Recent Chats
          </h2>
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm text-gray-500">No chats yet</p>
              <p className="text-xs text-gray-600 mt-1">Start a conversation!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-3 rounded-xl cursor-pointer group transition-all ${
                    currentConversationId === conv.id
                      ? "bg-green-600/20 border border-green-500/30"
                      : "hover:bg-gray-800/50 border border-transparent"
                  }`}
                  onClick={() => loadConversation(conv.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate mb-1">{conv.title}</p>
                      {conv.last_message && (
                        <p className="text-xs text-gray-400 truncate">
                          {conv.last_message}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 ml-2 text-red-400 hover:text-red-300 transition-all hover:scale-110"
                      aria-label="Delete conversation"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700/50 bg-gray-900/50">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-gray-800/50">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center font-bold shadow-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600/20 hover:bg-red-600 border border-red-600/30 hover:border-red-600 text-red-400 hover:text-white py-2.5 px-4 rounded-lg text-sm transition-all font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-all text-gray-600 hover:text-gray-900"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {currentConversationId
                  ? conversations.find((c) => c.id === currentConversationId)?.title || "Chat"
                  : "New Chat"}
              </h2>
              <p className="text-xs text-gray-500">Ask anything about PMAS Arid University</p>
            </div>
          </div>
          
          {/* Admin Dashboard Button */}
          {isAdmin && (
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Admin Dashboard
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.length === 0 && (
            <div className="text-center mt-32">
              <div className="inline-block p-6 bg-white rounded-3xl shadow-lg mb-6">
                <div className="text-6xl mb-4">👋</div>
                <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                  Hello, {user.name}!
                </h2>
                <p className="text-gray-600 text-lg">How can I assist you today?</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
                <button
                  onClick={() => setInput("Tell me about admission process")}
                  className="p-4 bg-white hover:bg-gray-50 rounded-2xl shadow-sm hover:shadow-md transition-all text-left border border-gray-200"
                >
                  <div className="text-2xl mb-2">📚</div>
                  <p className="font-semibold text-gray-800 mb-1">Admissions</p>
                  <p className="text-xs text-gray-500">Learn about the admission process</p>
                </button>
                <button
                  onClick={() => setInput("What scholarships are available?")}
                  className="p-4 bg-white hover:bg-gray-50 rounded-2xl shadow-sm hover:shadow-md transition-all text-left border border-gray-200"
                >
                  <div className="text-2xl mb-2">💰</div>
                  <p className="font-semibold text-gray-800 mb-1">Scholarships</p>
                  <p className="text-xs text-gray-500">Explore scholarship opportunities</p>
                </button>
                <button
                  onClick={() => setInput("Tell me about campus facilities")}
                  className="p-4 bg-white hover:bg-gray-50 rounded-2xl shadow-sm hover:shadow-md transition-all text-left border border-gray-200"
                >
                  <div className="text-2xl mb-2">🏛️</div>
                  <p className="font-semibold text-gray-800 mb-1">Campus</p>
                  <p className="text-xs text-gray-500">Discover campus facilities</p>
                </button>
              </div>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
            >
              <div
                className={`max-w-3xl p-5 rounded-2xl shadow-lg ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-green-600 to-green-500 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                        em: ({node, ...props}) => <em className="italic text-gray-700" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc ml-4 my-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal ml-4 my-2" {...props} />,
                        li: ({node, ...props}) => <li className="my-1" {...props} />,
                        p: ({node, ...props}) => <p className="my-2 leading-relaxed" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-xl font-bold my-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-lg font-bold my-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-base font-bold my-2" {...props} />,
                        code: ({node, inline, ...props}: any) => 
                          inline ? (
                            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props} />
                          ) : (
                            <code className="block bg-gray-100 p-2 rounded my-2 text-sm" {...props} />
                          ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="max-w-3xl p-5 rounded-2xl bg-white border border-gray-200 shadow-lg rounded-bl-none">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                  <span className="text-gray-500 text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 bg-white/80 backdrop-blur-sm border-t border-gray-200">
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3 flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-200 max-w-5xl mx-auto">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Image attached</p>
                <p className="text-xs text-gray-500">Ask a question about this image</p>
              </div>
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex gap-3 max-w-5xl mx-auto items-end">
            {/* Image Upload */}
            <ImageUpload 
              onImageSelected={handleImageSelected}
              disabled={loading}
            />

            {/* Input Field */}
            <input
              type="text"
              className="flex-1 border-2 border-gray-300 focus:border-green-500 rounded-2xl p-4 focus:ring-4 focus:ring-green-500/20 outline-none text-gray-900 bg-white shadow-sm transition-all placeholder-gray-400"
              placeholder={imagePreview ? "Ask about the image..." : "Type your message..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={loading}
            />

            {/* Voice Input */}
            <VoiceRecorder 
              onTranscription={handleVoiceTranscription}
              disabled={loading}
            />

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-white px-8 py-4 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-green-500/50 disabled:hover:shadow-none"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }
      `}</style>
    </div>
  );
}