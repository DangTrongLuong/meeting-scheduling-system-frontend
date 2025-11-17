import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Register from "./pages/Auth/Register.jsx";
import LoginPage from "./pages/Auth/Login.jsx";
import DashboardUser from "./pages/User/DashboardUser.jsx";
import Profile from "./pages/Auth/Profile.jsx";

import Room from "./pages/Admin/Room/Rooms.jsx";
import AddRoom from "./pages/Admin/Room/AddRoom.jsx";
import EditRoom from "./pages/Admin/Room/EditRoom.jsx";

import RoomDevices from "./pages/Admin/RoomDevice/RoomDevices.jsx";
import AddRoomDevice from "./pages/Admin/RoomDevice/AssignDevice.jsx";
import EditAssignment from "./pages/Admin/RoomDevice/EditAssignment.jsx";

import CalendarPage from "./pages/CalendarPage.jsx";
import VerifyPage from "./pages/Verify/VerifyPage.jsx";
import ForgotPasswordPage from "./pages/Auth/ForgotPassword.jsx";
import DashboardAdmin from "./pages/Admin/DashboardAdmin.jsx";
import Devices from "./pages/Admin/Device/Devices.jsx";
import AddDevice from "./pages/Admin/Device/AddDevice.jsx";
import EditDevice from "./pages/Admin/Device/EditDevice.jsx";

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
            path="/addRoom"
            element={
              <AuthMiddleware>
                <AddRoom />
              </AuthMiddleware>
            }
          />

          <Route
            path="/editRoom/:id"
            element={
              <AuthMiddleware>
                <EditRoom />
              </AuthMiddleware>
            }
          />

          <Route
            path="/deviceRoom"
            element={
              <AuthMiddleware>
                <RoomDevices />
              </AuthMiddleware>
            }
          />
          <Route
            path="/addRoomDevice"
            element={
              <AuthMiddleware>
                <AddRoomDevice />
              </AuthMiddleware>
            }
          />

          <Route
            path="/editAssignment/:id"
            element={
              <AuthMiddleware>
                <EditAssignment />
              </AuthMiddleware>
            }
          />

          <Route
            path="/loginSuccess"
            element={<AuthMiddleware>{null}</AuthMiddleware>}
          />
          <Route
            path="/user/meeting-schedule"
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
            path="/admin/dashboash"
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
            path="/createDevice"
            element={
              <AuthMiddleware>
                <AddDevice />
              </AuthMiddleware>
            }
          />

          <Route
            path="/editDevice/:id"
            element={
              <AuthMiddleware>
                <EditDevice />
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
