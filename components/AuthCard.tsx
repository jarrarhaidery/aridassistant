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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password || (mode === "signup" && !name)) {
      alert("Please fill all required fields");
      return;
    }

    if (password.length > 72) {
    alert("Password must be 72 characters or less");
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
          alert(data.error || "Signup failed");
          setLoading(false);
          return;
        }

        alert("Account created successfully! Please login.");
        router.push("/auth/login");
      } catch (error) {
        alert("Something went wrong");
        console.error(error);
      } finally {
        setLoading(false);
      }
    } else {
      // LOGIN
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
          alert(data.error || "Login failed");
          setLoading(false);
          return;
        }

        // Store JWT token and user data in localStorage
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("user", JSON.stringify(data.user));
          
          // Optional: Keep the cookie for compatibility
          document.cookie = "logged-in=true; path=/; max-age=86400";
          
          // Redirect to chat
          router.push("/main/chat");
        } else {
          alert("Login failed: No token received");
        }
      } catch (error) {
        alert("Something went wrong");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="md:flex w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-xl">
      {/* Left Section */}
      <div className="hidden md:flex md:w-1/2 relative">
        <img
          src="/student.jpg.png"
          alt="Student"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-green-700/70 to-black/20"></div>

        <div className="absolute bottom-90 left-8 text-white drop-shadow-lg">
          <h2 className="text-3xl font-bold">Grow With ARID Assistant</h2>
          <p className="text-sm font-bold text-white/90 max-w-xs mt-2">
            Personalized study help, guidance, and university information — all
            in one intelligent assistant.
          </p>
        </div>
      </div>

      {/* Right Section */}
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

        <form className="space-y-5" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Full Name"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm text-black bg-white placeholder-gray-400 focus:ring-2 focus:ring-green-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm text-black bg-white placeholder-gray-400 focus:ring-2 focus:ring-green-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm text-black bg-white placeholder-gray-400 focus:ring-2 focus:ring-green-400"
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
              <Link href="#" className="text-green-600">
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
              <Link href="/auth/signup" className="text-green-600 font-semibold">
                Create New Account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/auth/login" className="text-green-600 font-semibold">
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}