"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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
  
  // Debug: Log API URL on component mount
  useEffect(() => {
    console.log("API_URL configured as:", API_URL);
  }, []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

    console.log("Auth check - Token:", token ? "exists" : "missing");
    console.log("Auth check - User data:", userData);

    if (!token || !userData) {
      router.push("/auth/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      console.log("Parsed user:", parsedUser);
      setUser(parsedUser);
      loadConversations(parsedUser.id);
    } catch (error) {
      console.error("Failed to parse user data:", error);
      router.push("/auth/login");
    }
  }, [router]);

  const loadConversations = async (userId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const url = `${API_URL}/chat/conversations/${userId}`;
      console.log("Fetching conversations from:", url);
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Loaded conversations:", data);
        setConversations(Array.isArray(data) ? data : []);
      } else if (response.status === 404) {
        console.log("No conversations found (404), setting empty array");
        setConversations([]);
      } else {
        const errorText = await response.text();
        console.error("Failed to load conversations:", response.status, errorText);
        setConversations([]);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
      setConversations([]);
    }
  };

  const loadConversation = async (conversationId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_URL}/chat/conversations/${conversationId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

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

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");

      console.log("Sending message:", {
        message: currentInput,
        user_id: user?.id,
        conversation_id: currentConversationId,
      });

      const response = await fetch(`${API_URL}/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: currentInput,
          user_id: user?.id,
          conversation_id: currentConversationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", response.status, errorData);
        throw new Error(`Failed to get response: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);
      console.log("Conversation ID from response:", data.conversation_id);
      console.log("Current conversation ID:", currentConversationId);

      const aiMsg: Message = {
        role: "assistant",
        content: data.response || "I'm here to help!",
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (!currentConversationId && data.conversation_id) {
        console.log("Setting new conversation ID:", data.conversation_id);
        setCurrentConversationId(data.conversation_id);
        await loadConversations(user.id);
      } else if (currentConversationId) {
        console.log("Refreshing conversations for existing chat");
        await loadConversations(user.id);
      } else {
        console.error("WARNING: No conversation_id in response!", data);
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
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
              A
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
                  ? conversations.find((c) => c.id === currentConversationId)?.title ||
                    "Chat"
                  : "New Chat"}
              </h2>
              <p className="text-xs text-gray-500">Ask anything about PMAS Arid University</p>
            </div>
          </div>
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
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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
          <div className="flex gap-3 max-w-5xl mx-auto items-end">
            {/* Attachment Button (for OCR/Images) */}
            <button
              className="p-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
              disabled={loading}
              title="Upload image (OCR coming soon)"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Input Field */}
            <input
              type="text"
              className="flex-1 border-2 border-gray-300 focus:border-green-500 rounded-2xl p-4 focus:ring-4 focus:ring-green-500/20 outline-none text-gray-900 bg-white shadow-sm transition-all placeholder-gray-400"
              placeholder="Type your message..."
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

            {/* Voice Input Button (Whisper) */}
            <button
              className="p-3.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-2xl transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
              disabled={loading}
              title="Voice input (Whisper coming soon)"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

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
          <p className="text-xs text-gray-500 text-center mt-3">
            💡 Voice input and image OCR coming soon!
          </p>
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