import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Auth/Register.jsx";
import LoginPage from "./pages/Auth/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Profile from "./pages/Auth/Profile.jsx";

import { UserProvider } from "./context/UserContext.jsx";
import AuthMiddleware from "./middlewares/AuthMiddleware.jsx";
import "./App.css";
import VerifyPage from "./pages/Verify/VerifyPage.jsx";
import ForgotPasswordPage from "./pages/Auth/ForgotPassword.jsx";

function App() {
  return (
    <Router>
      <UserProvider>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/forgot_password" element={<ForgotPasswordPage />} />
          <Route
            path="/loginSuccess"
            element={<AuthMiddleware>{null}</AuthMiddleware>}
          />
          <Route
            path="/dashboard"
            element={
              <AuthMiddleware>
                <Dashboard />
              </AuthMiddleware>
            }
          />

          <Route
            path="/profile"
            element={
              <AuthMiddleware>
                <Profile />
              </AuthMiddleware>
            }
          />
        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;
