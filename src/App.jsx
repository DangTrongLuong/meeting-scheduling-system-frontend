import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Auth/Register.jsx";
import LoginPage from "./pages/Auth/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

import { UserProvider } from "./context/UserContext.jsx";
import AuthMiddleware from "./middlewares/AuthMiddleware.jsx";
import "./App.css";

function App() {
  return (
    <Router>
      <UserProvider>
        <Routes>
          {/* Public route - không cần login */}
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<LoginPage />} />
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
        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;
