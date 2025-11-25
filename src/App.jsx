import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Register from "./pages/Auth/Register.jsx";
import LoginPage from "./pages/Auth/Login.jsx";
import DashboardUser from "./pages/User/DashboardUser.jsx";
import Profile from "./pages/Auth/Profile.jsx";
import HomePage from "./pages/HomePage/HomePage.jsx";
import LoadingScreen from "./pages/HomePage/LoadingScreen.jsx";

import Room from "./pages/Admin/Room/Rooms.jsx";
import AddRoom from "./pages/Admin/Room/AddRoom.jsx";
import EditRoom from "./pages/Admin/Room/EditRoom.jsx";

import RoomDevices from "./pages/Admin/RoomDevice/RoomDevices.jsx";
import AddRoomDevice from "./pages/Admin/RoomDevice/AssignDevice.jsx";
import EditAssignment from "./pages/Admin/RoomDevice/EditAssignment.jsx";

import UserManagement from "./pages/Admin/UserManagement/UserManagement.jsx";

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
          <Route path="/homepage" element={<HomePage />} />
          <Route path="/redirecting" element={<LoadingScreen />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/forgot_password" element={<ForgotPasswordPage />} />

          {/* Protected routes */}
          <Route
            path="/admin/managementRooms"
            element={
              <AuthMiddleware>
                <Room />
              </AuthMiddleware>
            }
          />
          <Route
            path="/admin/addRoom"
            element={
              <AuthMiddleware>
                <AddRoom />
              </AuthMiddleware>
            }
          />

          <Route
            path="/admin/editRoom/:id"
            element={
              <AuthMiddleware>
                <EditRoom />
              </AuthMiddleware>
            }
          />

          <Route
            path="/admin/deviceRoom"
            element={
              <AuthMiddleware>
                <RoomDevices />
              </AuthMiddleware>
            }
          />
          <Route
            path="/admin/addRoomDevice"
            element={
              <AuthMiddleware>
                <AddRoomDevice />
              </AuthMiddleware>
            }
          />

          <Route
            path="/admin/editAssignment/:id"
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
            path="/admin/dashboard"
            element={
              <AuthMiddleware>
                <DashboardAdmin />
              </AuthMiddleware>
            }
          />
          <Route
            path="/admin/devices"
            element={
              <AuthMiddleware>
                <Devices />
              </AuthMiddleware>
            }
          />

          <Route
            path="/admin/createDevice"
            element={
              <AuthMiddleware>
                <AddDevice />
              </AuthMiddleware>
            }
          />

          <Route
            path="/admin/editDevice/:id"
            element={
              <AuthMiddleware>
                <EditDevice />
              </AuthMiddleware>
            }
          />

          <Route
            path="/admin/managementUsers"
            element={
              <AuthMiddleware>
                <UserManagement />
              </AuthMiddleware>
            }
          />
        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;
