import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// LOGIN
export const login = async (email, password) => {
  try {
    const response = await api.post("/auth/login", { email, password });
    const data = response.data;

    if (data && data.data) {
      const result = data.data;

      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("jwtToken", result.accessToken);
      localStorage.setItem(
        "tokenExpiresAt",
        Date.now() + result.expiresIn * 1000
      );
      localStorage.setItem("userId", result.id);
      localStorage.setItem("userEmail", result.email || email);
      localStorage.setItem("userName", result.name || "User");
      localStorage.setItem(
        "avatarUrl",
        result.avatarUrl || `/uploads/avatars/user-avatar.png`
      );
      localStorage.setItem("role", result.role || "USER");
      localStorage.setItem(
        "created_at",
        result.createdAt || new Date().toISOString().split("T")[0]
      );
      localStorage.setItem("backgroundUrl", result.backgroundUrl || null);
      localStorage.setItem("authProvider", result.authProvider || "LOCAL");

      return { ...result, authProvider: "LOCAL" };
    }

    throw new Error(data.message || "Login failed");
  } catch (error) {
    console.error("Login error:", error);
    if (error.response) {
      throw new Error(
        error.response.data.message || "Server error during login"
      );
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error(error.message);
    }
  }
};

// REGISTER
export const register = async (name, email, password) => {
  try {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });
    const data = response.data;

    if (
      response.status === 302 ||
      response.request?.responseURL?.includes("redirect")
    ) {
      throw new Error("Unexpected redirect during registration");
    }

    if (response.headers["content-type"]?.includes("application/json")) {
      if (response.status === 200 && data.success && data.result) {
        return data.result;
      } else {
        throw new Error(data.message || data.error || "Registration failed");
      }
    } else {
      throw new Error("Server returned non-JSON response");
    }
  } catch (error) {
    console.error("Registration error:", error);
    if (error.message.includes("Network Error")) {
      throw new Error(
        "Network error: Unable to connect to server. Please check if the server is running."
      );
    }
    if (error.response) {
      throw new Error(
        error.response.data.message || "Server error during registration"
      );
    }
    throw error;
  }
};
