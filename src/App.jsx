import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Auth/Register.jsx";
import LoginPage from "./pages/Auth/Login.jsx";
import DashboardUser from "./pages/User/DashboardUser.jsx";
import Profile from "./pages/Auth/Profile.jsx";
import Room from "./pages/Admin/Room/RoomsList.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import VerifyPage from "./pages/Verify/VerifyPage.jsx";
import ForgotPasswordPage from "./pages/Auth/ForgotPassword.jsx";
import DashboardAdmin from "./pages/Admin/DashboardAdmin.jsx";
import Devices from "./pages/Admin/Device/Devices.jsx";

import { UserProvider } from "./context/UserContext.jsx";
import AuthMiddleware from "./middlewares/AuthMiddleware.jsx";
import "./App.css";

function App() {
  return (
    <Router>
      <UserProvider>
        <Routes>
          {/* Auth routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/forgot_password" element={<ForgotPasswordPage />} />

          {/* Protected routes */}
          <Route
            path="/managementRooms"
            element={
              <AuthMiddleware>
                <Room />
              </AuthMiddleware>
            }
          />
          <Route
            path="/loginSuccess"
            element={<AuthMiddleware>{null}</AuthMiddleware>}
          />
          <Route
            path="/dashboardUser"
            element={
              <AuthMiddleware>
                <DashboardUser />
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
          <Route
            path="/dashboardAdmin"
            element={
              <AuthMiddleware>
                <DashboardAdmin />
              </AuthMiddleware>
            }
          />
          <Route
            path="/devices"
            element={
              <AuthMiddleware>
                <Devices />
              </AuthMiddleware>
            }
          />
          <Route
            path="/calendar"
            element={
              <AuthMiddleware>
                <CalendarPage />
              </AuthMiddleware>
            }
          />
        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;