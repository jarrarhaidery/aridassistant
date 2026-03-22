"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    
    if (!userData) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    
    // Check if user is admin
    if (parsedUser.role !== "admin") {
      alert("Access denied. Admin only.");
      router.push("/main/chat");
      return;
    }

    setUser(parsedUser);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/documents", label: "Documents" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/analytics", label: "Analytics" },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col shadow-xl">
        {/* Logo Header */}
        <div className="p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
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
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-xs text-gray-400">Arid Assistant</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-green-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            
            <div className="pt-4 mt-4 border-t border-gray-700">
              <Link
                href="/main/chat"
                className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-all"
              >
                Go to Chat
              </Link>
            </div>
          </div>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-700">
          <div className="mb-3 p-3 rounded-lg bg-gray-800/50">
            <div className="text-xs text-gray-400 mb-1">Logged in as</div>
            <div className="text-sm font-semibold text-white">{user?.name}</div>
            <div className="text-xs text-gray-400">{user?.email}</div>
            <span className="inline-block mt-2 text-xs bg-green-600 text-white px-2 py-1 rounded">
              Admin
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600/20 hover:bg-red-600 border border-red-600/30 hover:border-red-600 text-red-400 hover:text-white py-2.5 rounded-lg text-sm transition-all font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}