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

    try {
      console.log("Local login failed, attempting admin login");

      const response = await axios.post(
        "http://localhost:8080/api/admin/auth/login",
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      const data = response.data;

      if (response.status === 200 && data.token) {
        console.log("Admin login data", data);

        localStorage.setItem("accessToken", data.token);
        localStorage.setItem("tokenExpiresAt", Date.now() + 3600 * 1000); // 1 hour
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userEmail", data.user.email || email);
        localStorage.setItem("userName", data.user.username || "Admin");
        localStorage.setItem(
          "avatarUrl",
          "http://localhost:8080/uploads/avatars/user-avatar.png"
        );
        localStorage.setItem("role", data.user.role || "ADMIN");
        localStorage.setItem(
          "created_at",
          new Date().toISOString().split("T")[0]
        );
        localStorage.setItem("backgroundUrl", null);
        localStorage.setItem("authProvider", "admin");

        return {
          accessToken: data.token,
          expiresIn: 3600,
          id: data.user.id,
          email: data.user.email,
          name: data.user.username,
          avatarUrl: "http://localhost:8080/uploads/avatars/user-avatar.png",
          role: data.user.role || "ADMIN",
          createdAt: new Date().toISOString().split("T")[0],
          backgroundUrl: null,
          authProvider: "admin",
        };
      }
    } catch (error) {
      console.error("Admin login failed:", error);
    }

    throw new Error(data.message || "Login failed");
  } catch (error) {
    const msg = error.message;
    if (msg.includes("Account not activated")) {
      throw new Error("Account not activated. Please check your email!");
    }
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
