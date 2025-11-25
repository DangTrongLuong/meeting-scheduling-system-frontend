import { useEffect, useRef, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { useUser } from "../context/UserContext";
import axios from "axios";

const AuthMiddleware = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUser();
  //   const { triggerSuccess } = useContext(NotificationContext);
  const hasFetched = useRef(false);
  const isProcessingLoginSuccess = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  const publicRoutes = ["/", "/register"];

  useEffect(() => {
    const refreshAccessToken = async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      const authProvider = localStorage.getItem("authProvider");

      if (!refreshToken || refreshToken === "" || authProvider !== "google") {
        console.log("No valid refresh token or not Google auth");
        return false;
      }

      try {
        const response = await axios.post(
          `/api/auth/refresh-token`,
          { refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = response.data;
        if (data.access_token) {
          localStorage.setItem("accessToken", data.access_token);
          localStorage.setItem(
            "tokenExpiresAt",
            Date.now() + data.expires_in * 1000
          );
          console.log("Access token refreshed successfully");
          return true;
        } else {
          console.error("Failed to refresh token:", data.error);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("tokenExpiresAt");
          return false;
        }
      } catch (error) {
        console.error("Error refreshing token:", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenExpiresAt");
        return false;
      }
    };

    const checkAuth = async () => {
      if (isProcessingLoginSuccess.current) {
        console.log("Skipping checkAuth during loginSuccess processing");
        return;
      }

      const accessToken = localStorage.getItem("accessToken");
      const expiresAt = localStorage.getItem("tokenExpiresAt");
      const authProvider = localStorage.getItem("authProvider");
      const role = localStorage.getItem("role");

      if (!accessToken || !expiresAt) {
        console.log(
          "No access token or expiration time, redirecting to /login"
        );
        if (!publicRoutes.includes(location.pathname)) {
          navigate("/", { replace: true });
        }
        return;
      }

      const isTokenExpired = () => {
        const expiresAtNum = parseInt(expiresAt, 10);
        return expiresAtNum < Date.now();
      };

      if (isTokenExpired()) {
        if (authProvider === "google") {
          console.log("Token expired for Google, attempting to refresh");
          const refreshed = await refreshAccessToken();
          if (!refreshed) {
            console.log("Token refresh failed, redirecting to /login");
            navigate("/", { replace: true });
            return;
          }
        } else {
          console.log(
            `Token expired for ${authProvider} login, redirecting to /login`
          );
          navigate("/", { replace: true });
          return;
        }
      }

      // Kiểm tra quyền truy cập admin

      if (
        location.pathname.startsWith("/admin") &&
        role !== "ADMIN" &&
        role !== "SUPERADMIN"
      ) {
        console.log("Access denied: Admin or SuperAdmin role required");
        navigate("/", { replace: true });
        return;
      }
    };

    if (publicRoutes.includes(location.pathname)) {
      console.log("Skipping auth check for public route:", location.pathname);
      return;
    }

    if (location.pathname === "/loginSuccess") {
      console.log("=== PROCESSING /loginSuccess ===");
      console.log("hasFetched.current:", hasFetched.current);
      console.log(
        "isProcessingLoginSuccess.current:",
        isProcessingLoginSuccess.current
      );

      if (hasFetched.current || isProcessingLoginSuccess.current) {
        console.log("Already processing loginSuccess, skipping...");
        setDebugInfo("Already processing loginSuccess, skipping...");
        return;
      }

      hasFetched.current = true;
      isProcessingLoginSuccess.current = true;
      setIsLoading(true);
      setDebugInfo("Starting user info fetch...");

      axios
        .get(`/api/auth/user-info`, {
          withCredentials: true,
          headers: {
            Accept: "application/json",
          },
        })
        .then((response) => {
          console.log("User info response status:", response.status);
          console.log("User info response headers:", response.headers);
          setDebugInfo(`Response status: ${response.status}`);

          const data = response.data;
          console.log("Received user info:", data);
          setDebugInfo(`Received data: ${JSON.stringify(data, null, 2)}`);

          if (data.error) {
            console.error("Error in user info response:", data.error);
            setDebugInfo(`Error in response: ${data.error}`);
            navigate("/?error=session_expired", { replace: true });
            return;
          }

          if (!data.accessToken) {
            console.error("No accessToken in response, redirecting to /login");
            setDebugInfo("No accessToken in response");
            navigate("/?error=no_token", { replace: true });
            return;
          }

          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("authProvider", "google");
          const expiresIn = data.expiresIn || 3600;
          localStorage.setItem("tokenExpiresAt", Date.now() + expiresIn * 1000);

          if (data.refreshToken && data.refreshToken !== "") {
            localStorage.setItem("refreshToken", data.refreshToken);
          }
          localStorage.setItem("userId", data.userId);
          localStorage.setItem("userName", data.name || "User");
          localStorage.setItem("userEmail", data.email || "user@example.com");
          localStorage.setItem("avatarUrl", data.avatarUrl || "");
          localStorage.setItem("role", data.role || "USER");
          localStorage.setItem(
            "created_at",
            data.created_at || new Date().toISOString().split("T")[0]
          );
          localStorage.setItem("backgroundUrl", data.backgroundUrl || null);
          localStorage.setItem("authProvider", data.authProvider || "GOOGLE");

          setUser({
            avatarUrl: data.avatarUrl || null,
            userName: data.name || null,
            backgroundUrl: data.backgroundUrl || null,
            role: data.role || "USER",
          });

          console.log("=== STORED IN LOCALSTORAGE ===");
          console.log(
            "accessToken:",
            localStorage.getItem("accessToken")?.substring(0, 20) + "..."
          );
          console.log("userId", localStorage.getItem("userId"));
          console.log("userName:", localStorage.getItem("userName"));
          console.log("userEmail:", localStorage.getItem("userEmail"));
          console.log("avatarUrl:", localStorage.getItem("avatarUrl"));
          console.log("role:", localStorage.getItem("role"));
          console.log("created_at:", localStorage.getItem("created_at"));
          console.log("backgroundUrl:", localStorage.getItem("backgroundUrl"));

          console.log("Login success, navigating to dashboard");
          setDebugInfo("Navigating to dashboard...");
          //   triggerSuccess(`Welcome, you have logged in successfully`);
          setIsLoading(false);
          navigate("/user/meeting-schedule", { replace: true });
        })
        .catch((error) => {
          console.error("Error fetching user info:", error);
          setDebugInfo(`Error: ${error.message}`);
          setIsLoading(false);
          navigate("/?error=fetch_failed", { replace: true });
        })
        .finally(() => {
          console.log("=== CLEANUP ===");
          isProcessingLoginSuccess.current = false;
        });

      return;
    }

    checkAuth();
  }, [location.pathname, location.search, navigate]);

  if (location.pathname === "/loginSuccess") {
    return (
      <div
        style={{
          display: "flex",
          width: "100vw",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          padding: "20px",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          {isLoading ? "Processing login..." : "Redirect..."}
        </div>
      </div>
    );
  }

  return children;
};

export default AuthMiddleware;
