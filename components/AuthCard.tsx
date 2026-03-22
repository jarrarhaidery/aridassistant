// components/AuthCard.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Mode = "login" | "signup";

interface AuthCardProps {
  mode?: Mode;
}

export default function AuthCard({ mode = "login" }: AuthCardProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password || (mode === "signup" && !name)) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);

    if (mode === "signup") {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Signup failed. Please try again.");
          setLoading(false);
          return;
        }

        setSuccess("Account created successfully! Redirecting...");
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      } catch (error) {
        setError("Connection error. Please check your internet.");
        console.error(error);
        setLoading(false);
      }
    } else {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Invalid email or password");
          setLoading(false);
          return;
        }

        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("user", JSON.stringify(data.user));
          document.cookie = "logged-in=true; path=/; max-age=86400";
          
          if (data.user.role === 'admin') {
            router.push("/admin/dashboard");
          } else {
            router.push("/main/chat");
          }
        } else {
          setError("Login failed. No token received.");
          setLoading(false);
        }
      } catch (error) {
        setError("Connection error. Please try again.");
        console.error(error);
        setLoading(false);
      }
    }
  };

  return (
    <div className="md:flex w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-xl">
      <div className="hidden md:flex md:w-1/2 relative">
        <img
          src="/uiit.jpg"
          alt="Student"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-green-700/70 to-black/20"></div>

        
        <div className="absolute inset-0 flex items-center justify-center text-white drop-shadow-lg p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Arid Assistant</h2>
            <p className="text-sm font-bold text-white/90 max-w-xs mt-2 mx-auto">
            Your intelligent guide to university life, academic support, and campus information.
          </p>
        </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 p-10 bg-white">
        <div className="flex items-center gap-3 mb-8">
          <img src="/arid-logo.png" className="w-12 h-12" alt="ARID Logo" />
          <div>
            <h1 className="text-2xl font-bold text-gray-700">Arid Assistant</h1>
            <p className="text-sm text-gray-500">Your Virtual University Guide</p>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-6 text-gray-600">
          {mode === "login" ? "Sign in to your account" : "Create your account"}
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-slideDown">
            <div className="flex items-center gap-3">
              <span className="text-red-500 text-xl flex-shrink-0">⚠️</span>
              <p className="text-sm font-medium text-red-800 flex-1">{error}</p>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-600 transition-colors text-lg"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg animate-slideDown">
            <div className="flex items-center gap-3">
              <span className="text-green-500 text-xl flex-shrink-0">✓</span>
              <p className="text-sm font-medium text-green-800 flex-1">{success}</p>
            </div>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Full Name"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm text-black bg-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm text-black bg-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm text-black bg-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          {mode === "login" && (
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-900">
                <input type="checkbox" className="w-4 h-4" />
                Keep me logged in
              </label>
              <Link href="#" className="text-green-600 hover:text-green-700">
                Forgot Password?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="text-sm text-center mt-6 text-gray-600">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-green-600 font-semibold hover:text-green-700">
                Create New Account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/auth/login" className="text-green-600 font-semibold hover:text-green-700">
                Login
              </Link>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}