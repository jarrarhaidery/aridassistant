"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Stats {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  documentsInKB: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalConversations: 0,
    totalMessages: 0,
    documentsInKB: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("access_token");
      
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalUsers: data.totalUsers,
          totalConversations: data.totalConversations,
          totalMessages: data.totalMessages,
          documentsInKB: data.documentsInKB,
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Admin Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Platform overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Total Users
          </p>
          <h3 className="text-3xl font-semibold text-gray-900">
            {stats.totalUsers.toLocaleString()}
          </h3>
        </div>

        {/* Total Conversations */}
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Conversations
          </p>
          <h3 className="text-3xl font-semibold text-gray-900">
            {stats.totalConversations.toLocaleString()}
          </h3>
        </div>

        {/* Total Messages */}
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Messages
          </p>
          <h3 className="text-3xl font-semibold text-gray-900">
            {stats.totalMessages.toLocaleString()}
          </h3>
        </div>

        {/* Documents in KB */}
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Knowledge Base
          </p>
          <h3 className="text-3xl font-semibold text-gray-900">
            {stats.documentsInKB.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => window.location.href = '/admin/documents'}
            className="text-left p-4 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all"
          >
            <p className="font-medium text-gray-900 mb-1">Upload Document</p>
            <p className="text-sm text-gray-600">Add to knowledge base</p>
          </button>

          <button 
            onClick={() => window.location.href = '/admin/users'}
            className="text-left p-4 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all"
          >
            <p className="font-medium text-gray-900 mb-1">Manage Users</p>
            <p className="text-sm text-gray-600">View and manage users</p>
          </button>

          <button 
            onClick={() => window.location.href = '/admin/analytics'}
            className="text-left p-4 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all"
          >
            <p className="font-medium text-gray-900 mb-1">View Analytics</p>
            <p className="text-sm text-gray-600">Usage statistics</p>
          </button>
        </div>
      </div>
    </div>
  );
}