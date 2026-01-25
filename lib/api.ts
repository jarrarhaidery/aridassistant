// API Client for FastAPI Backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  data?: T;
}

// Generic fetch wrapper
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("access_token");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  // Add custom headers from options if provided
  if (options.headers) {
    const optionHeaders = new Headers(options.headers);
    optionHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  // Add authorization header if token exists
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.error || "Something went wrong");
  }

  return data;
}

// Auth API calls
export const authAPI = {
  signup: async (name: string, email: string, password: string) => {
    return fetchAPI("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  login: async (email: string, password: string) => {
    const data = await fetchAPI<{
      access_token: string;
      token_type: string;
      user: { id: number; name: string; email: string };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    // Store token in localStorage
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("access_token");
  },
};

// Chat API calls
export const chatAPI = {
  sendMessage: async (message: string, userId?: number) => {
    return fetchAPI("/chat/message", {
      method: "POST",
      body: JSON.stringify({ message, user_id: userId }),
    });
  },

  getChatHistory: async (userId: number, limit: number = 50) => {
    return fetchAPI(`/chat/history/${userId}?limit=${limit}`);
  },
};

export default { authAPI, chatAPI };