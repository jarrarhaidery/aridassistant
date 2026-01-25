"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Conversation = {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function Sidebar() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [user, setUser] = useState<any>(null);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadConversations(parsedUser.id);
    }
  }, []);

  const loadConversations = async (userId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/chat/conversations/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    router.push("/main/chat");
    // Trigger a page refresh to clear messages
    window.dispatchEvent(new CustomEvent("newChat"));
  };

  const handleLoadConversation = async (conversationId: number) => {
    setCurrentConversationId(conversationId);
    window.dispatchEvent(new CustomEvent("loadConversation", { 
      detail: { conversationId } 
    }));
  };

  const handleDeleteConversation = async (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Delete this conversation?")) return;

    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${API_URL}/chat/conversations/${conversationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (currentConversationId === conversationId) {
        handleNewChat();
      }

      if (user) {
        loadConversations(user.id);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    document.cookie = "logged-in=; Max-Age=0; path=/";
    router.push("/auth/login");
  };

  return (
    <aside className="w-64 bg-black rounded-l-3xl p-6 shadow-lg flex flex-col h-full">
      {/* Logo */}
      <a
        href="https://www.uaar.edu.pk/index.php"
        target="_blank"
        rel="noopener noreferrer"
        className="mb-6"
      >
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <img src="/arid-logo.png" className="w-10" alt="Logo" />
          ARID Assistant
        </h1>
      </a>

      {/* New Chat Button */}
      <button
        onClick={handleNewChat}
        className="w-full p-3 mb-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition"
      >
        + New Chat
      </button>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto mb-4">
        <h2 className="text-xs text-gray-400 uppercase mb-3 px-2">Chat History</h2>
        
        {conversations.length === 0 ? (
          <p className="text-sm text-gray-500 px-2">No conversations yet</p>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleLoadConversation(conv.id)}
                className={`p-3 rounded-lg cursor-pointer group transition ${
                  currentConversationId === conv.id
                    ? "bg-green-600 text-white"
                    : "hover:bg-gray-800 text-gray-300"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    {conv.last_message && (
                      <p className="text-xs opacity-70 truncate mt-1">
                        {conv.last_message}
                      </p>
                    )}
                    <p className="text-xs opacity-50 mt-1">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 ml-2 text-red-400 hover:text-red-300 transition"
                    title="Delete conversation"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Info & Logout */}
      <div className="pt-4 border-t border-gray-700">
        {user && (
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}