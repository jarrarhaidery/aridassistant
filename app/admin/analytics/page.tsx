"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface AnalyticsData {
  totalQueries: number;
  activeUsers: number;
  avgResponseTime: number;
  popularQueries: Array<{ query: string; count: number }>;
  dailyActivity: Array<{ date: string; messages: number; users: number }>;
  topUsers: Array<{ name: string; email: string; queryCount: number }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("7d");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/admin/analytics?range=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              Analytics Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              Usage statistics and performance metrics
            </p>
          </div>

          {/* Time Range Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange("7d")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                timeRange === "7d"
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeRange("30d")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                timeRange === "30d"
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange("all")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                timeRange === "all"
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Total Queries
          </p>
          <p className="text-3xl font-semibold text-gray-900">
            {(analytics?.totalQueries ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Messages processed by chatbot
          </p>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Active Users
          </p>
          <p className="text-3xl font-semibold text-gray-900">
            {(analytics?.activeUsers ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Users who sent messages
          </p>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Avg Response Time
          </p>
          <p className="text-3xl font-semibold text-gray-900">
            {(analytics?.avgResponseTime ?? 0).toFixed(2)}s
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Chatbot processing speed
          </p>
        </div>
      </div>

      {/* Popular Queries */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Most Popular Queries
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Query
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Count
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analytics?.popularQueries && analytics.popularQueries.length > 0 ? (
                analytics.popularQueries.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.query}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      {(item.count ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                    No query data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Activity */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Daily Activity
        </h2>
        <div className="space-y-3">
          {analytics?.dailyActivity && analytics.dailyActivity.length > 0 ? (
            analytics.dailyActivity.map((day, index) => (
              <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{day.date}</p>
                </div>
                <div className="flex gap-8">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Messages</p>
                    <p className="text-sm font-semibold text-gray-900">{day.messages}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Users</p>
                    <p className="text-sm font-semibold text-gray-900">{day.users}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-gray-500 py-8">
              No activity data available
            </p>
          )}
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Most Active Users
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Queries
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analytics?.topUsers && analytics.topUsers.length > 0 ? (
                analytics.topUsers.map((user, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-semibold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">
                      {(user.queryCount ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                    No user data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}