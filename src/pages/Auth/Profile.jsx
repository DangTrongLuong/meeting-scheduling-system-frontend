import React, { useState, useEffect, useRef, useContext, use } from "react";

import NavBar from "../../components/NavBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrashCan } from "@fortawesome/free-regular-svg-icons";
import "../../styles/Auth_style/Profile.css";
import { useUser } from "../../context/UserContext";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const ProfileContent = () => {
  const { user, setUser } = useUser();

  const [userInfo, setUserInfo] = useState({});

  const [userName, setUserName] = useState(
    localStorage.getItem("userName") || "User"
  );
  const [userEmail, setUserEmail] = useState(
    localStorage.getItem("userEmail") || "user@example.com"
  );

  const [role, setRole] = useState(localStorage.getItem("role"));
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);

  const [backgroundUrl, setBackgroundUrl] = useState(user.backgroundUrl);

  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");
  const [createdAt, setCreatedAt] = useState(
    localStorage.getItem("created_at") || ""
  );

  const [showEditInfoForm, setShowEditInfoForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    age: "",
    address: "",
  });
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({
    newPassword: false,
    confirmPassword: false,
  });
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const fullNameRef = useRef(null);
  const emailRef = useRef(null);
  const roleRef = useRef(null);
  const ageRef = useRef(null);
  const addressRef = useRef(null);
  const createdAtRef = useRef(null);
  const profileImgRef = useRef(null);
  const coverImgRef = useRef(null);
  const removeCoverBtnRef = useRef(null);

  const validatePassword = (passwordValue) => {
    if (!passwordValue) {
      return "New password is required";
    }
    if (passwordValue.length < 8) {
      return "Password must be at least 8 characters";
    }
    const hasLower = /[a-z]/.test(passwordValue);
    const hasUpper = /[A-Z]/.test(passwordValue);
    const hasNumber = /[0-9]/.test(passwordValue);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      passwordValue
    );

    if (!hasLower) return "Password must contain at least one lowercase letter";
    if (!hasUpper) return "Password must contain at least one uppercase letter";
    if (!hasNumber) return "Password must contain at least one number";
    if (!hasSpecial)
      return "Password must contain at least one special character";

    return "";
  };

  const updateDOM = () => {
    if (fullNameRef.current) fullNameRef.current.textContent = userName;
    if (emailRef.current) emailRef.current.textContent = userEmail;
    if (roleRef.current) roleRef.current.textContent = role;
    if (ageRef.current) ageRef.current.textContent = age || "N/A";
    if (addressRef.current) addressRef.current.textContent = address || "N/A";
    if (createdAtRef.current) createdAtRef.current.textContent = createdAt;
    if (profileImgRef.current) profileImgRef.current.src = user.avatarUrl;
    if (coverImgRef.current) {
      const fullBackgroundUrl = backgroundUrl
        ? backgroundUrl.startsWith("http")
          ? backgroundUrl
          : `${"http://localhost:8080"}${backgroundUrl}`
        : "";

      coverImgRef.current.src = fullBackgroundUrl;
      coverImgRef.current.classList.toggle("visible", !!backgroundUrl);
    }
    if (removeCoverBtnRef.current)
      removeCoverBtnRef.current.style.display = backgroundUrl
        ? "block"
        : "none";
  };

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      fetchUserInfo(userId);
    }
  }, []);

  useEffect(() => {
    updateDOM();
  }, [userName, userEmail, age, address, avatarUrl, backgroundUrl, createdAt]);

  const fetchUserInfo = async (userId) => {
    try {
      const response = await axios.get(`/api/auth/get-users/${userId}`);
      const data = response.data;

      setUserInfo(data);
      setUserName(data.name || "User");
      setRole(data.role);
      setUserEmail(data.email || "user@example.com");
      setAge(data.age || "");
      setAddress(data.address || "");
      setCreatedAt(localStorage.getItem("created_at") || "");

      const avatarUrl = data.avatar_url;
      setAvatarUrl(avatarUrl);
      setUser({ ...user, avatarUrl: avatarUrl });
      localStorage.setItem("avatarUrl", avatarUrl);

      if (data.backgroundUrl) {
        setBackgroundUrl(data.backgroundUrl);
        setUser({ ...user, backgroundUrl: data.backgroundUrl });
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      toast.error("Failed to load user information");
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large! Please select a file smaller than 5MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("email", userEmail);

    try {
      const response = await axios.post("/api/auth/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        const newAvatarUrl = response.data.avatar_url;
        setAvatarUrl(newAvatarUrl);
        setUser({ ...user, avatarUrl: newAvatarUrl });
        localStorage.setItem("avatarUrl", newAvatarUrl);
        toast.success("Avatar updated successfully");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    }
  };

  const getFullAvatarUrl = (url) => {
    // if (!url) return "http://localhost:8080/uploads/avatars/user-avatar.png";

    return url.startsWith("http") ? url : `http://localhost:8080${url}`;
  };

  const handleBackgroundChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large! Please select a file smaller than 5MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    const formData = new FormData();
    formData.append("background", file);
    formData.append("email", userEmail);

    try {
      const response = await axios.post(
        "/api/auth/upload-background",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        const newBackgroundUrl = response.data.background_url;
        setBackgroundUrl(newBackgroundUrl);
        localStorage.setItem("backgroundUrl", newBackgroundUrl);
        toast.success("Background updated successfully");
      }
    } catch (error) {
      console.error("Error uploading background:", error);
      toast.error("Failed to upload background");
    }
  };

  const handleRemoveBackground = () => {
    setConfirmMessage("Are you sure you want to remove the background image?");
    setConfirmAction(() => async () => {
      try {
        const response = await axios.post("/api/auth/remove-background", {
          email: userEmail,
        });

        if (response.data.success) {
          setBackgroundUrl("");
          localStorage.removeItem("backgroundUrl");
          toast.success("Background removed successfully");
        }
      } catch (error) {
        console.error("Error removing background:", error);
        toast.error("Failed to remove background");
      }
      setShowConfirmForm(false);
    });
    setShowConfirmForm(true);
  };

  const handleEditInfo = () => {
    setEditFormData({
      name: userName,
      age: age,
      address: address,
    });
    setShowEditInfoForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateAge = () => {
    const ageValue = editFormData.age;

    if (!ageValue || ageValue.trim() === "") {
      return true;
    }

    const ageNumber = Number(ageValue);
    if (isNaN(ageNumber) || ageNumber < 8 || ageNumber > 100) {
      toast.error("Age must be a number between 8 and 100.");
      return false;
    }

    return true;
  };

  const handleUpdateInfo = () => {
    if (!validateAge()) return;

    setConfirmMessage("Are you sure you want to update your information?");
    setConfirmAction(() => async () => {
      try {
        const response = await axios.put(
          `/api/auth/update-user/${userInfo.id}`,
          {
            name: editFormData.name,
            age: parseInt(editFormData.age),
            address: editFormData.address,
          }
        );

        if (response.data) {
          setUserName(editFormData.name);
          setAge(editFormData.age);
          setAddress(editFormData.address);
          setUser({
            ...user,
            userName: editFormData.name,
          });
          setUserInfo({
            ...userInfo,
            name: editFormData.name,
            age: editFormData.age,
            address: editFormData.address,
          });
          localStorage.setItem("userName", editFormData.name);
          setShowEditInfoForm(false);
          toast.success("Information updated successfully");
        }
      } catch (error) {
        toast.error("Failed to update user information.");
      }
      setShowConfirmForm(false);
    });
    setShowConfirmForm(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessMessage("");

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setShowConfirmModal(true);
  };

  const submitPasswordChange = async () => {
    try {
      const response = await axios.post("/api/admin/auth/reset-password", {
        email: localStorage.getItem("userEmail"),
        currentPassword: currentPassword,
        newPassword: newPassword,
      });

      const result = response.data;
      if (result.success) {
        toast.success("Password changed successfully.");
        setSuccessMessage(
          response.data.message || "Password reset successfully."
        );
        setShowConfirmModal(false);
        setShowPasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setGeneralError(
          error.response?.data?.message || "Failed to reset password."
        );
      }
    } catch (error) {
      setShowConfirmModal(false);
      setGeneralError(
        error.response?.data?.message || "Failed to reset password."
      );
      toast.error(
        error.response?.data?.message ||
          "Error occurred while changing password."
      );
    }
  };

  return (
    <>
      <ToastContainer position="top-right" style={{ marginTop: "60px" }} />

      <div className="container-profile">
        <NavBar />
        <div id="global-progress-bar" className="progress-bar"></div>
        <div className="content-container-profile">
          <div className={`main-container-profile`}>
            <div className="profile-container-cover">
              <div className="cover-image">
                <img
                  src={backgroundUrl}
                  className="cover-img"
                  id="cover-img"
                  ref={coverImgRef}
                  alt="Cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <div className="cover-buttons">
                  <input
                    type="file"
                    id="background-input"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleBackgroundChange}
                  />
                  <button
                    className="add-cover-btn"
                    id="add-cover-btn"
                    onClick={() =>
                      document.getElementById("background-input").click()
                    }
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                    Add Background Image
                  </button>
                  <button
                    className="remove-cover-btn"
                    id="remove-cover-btn"
                    ref={removeCoverBtnRef}
                    style={{ display: backgroundUrl ? "block" : "none" }}
                    onClick={handleRemoveBackground}
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                    Remove Background Image
                  </button>
                </div>
              </div>

              <div className="profile-container-info">
                <div className="profile-person">
                  <div className="personal-img">
                    <img
                      src={getFullAvatarUrl(user.avatarUrl)}
                      alt="Profile Picture"
                      className="profile-img"
                      ref={profileImgRef}
                      onError={(e) => {
                        e.target.src = `${getFullAvatarUrl(user.avatarUrl)}`;
                      }}
                    />
                  </div>

                  <div className="btn-edit-change-profile">
                    <input
                      type="file"
                      id="avatar-input"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleAvatarChange}
                    />
                    <button
                      id="edit-avatar-btn"
                      className="edit-btn"
                      onClick={() =>
                        document.getElementById("avatar-input").click()
                      }
                    >
                      Edit Picture
                    </button>

                    <button
                      id="change-password-btn"
                      className="edit-btn"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      Change Password
                    </button>
                  </div>
                  {showPasswordModal && (
                    <div className="modal-overlay-profile">
                      <div className="modal-content-profile">
                        <h2>Change Password</h2>
                        <form onSubmit={handlePasswordSubmit}>
                          <label>Email:</label>
                          <input
                            type="email"
                            value={localStorage.getItem("userEmail")}
                            readOnly
                            className="readonly-input"
                          />

                          <label>Current Password:</label>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            onFocus={() => setGeneralError("")}
                            required
                            placeholder="Enter current password"
                          />

                          {/* New Password Field with Validation */}
                          <label>New Password:</label>
                          <div className="password-input-group">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => {
                                setNewPassword(e.target.value);
                                if (touched.newPassword) {
                                  setNewPasswordError(
                                    validatePassword(e.target.value)
                                  );
                                }
                              }}
                              onBlur={() => {
                                setTouched({ ...touched, newPassword: true });
                                setNewPasswordError(
                                  validatePassword(newPassword)
                                );
                              }}
                              onFocus={() => setGeneralError("")}
                              required
                              placeholder="Enter new password"
                              className={
                                touched.newPassword && newPasswordError
                                  ? "input-error"
                                  : ""
                              }
                            />
                            <span
                              className="password-toggle-icon"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <AiOutlineEyeInvisible />
                              ) : (
                                <AiOutlineEye />
                              )}
                            </span>
                          </div>
                          {touched.newPassword && newPasswordError && (
                            <span className="login-error-text">
                              {newPasswordError}
                            </span>
                          )}

                          <label>Confirm New Password:</label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              if (touched.confirmPassword) {
                                setConfirmPasswordError(
                                  e.target.value !== newPassword
                                    ? "Passwords do not match"
                                    : ""
                                );
                              }
                            }}
                            onBlur={() => {
                              setTouched({ ...touched, confirmPassword: true });
                              setConfirmPasswordError(
                                confirmPassword !== newPassword
                                  ? "Passwords do not match"
                                  : ""
                              );
                            }}
                            onFocus={() => setGeneralError("")}
                            required
                            placeholder="Confirm new password"
                            className={
                              touched.confirmPassword && confirmPasswordError
                                ? "input-error"
                                : ""
                            }
                          />
                          {touched.confirmPassword && confirmPasswordError && (
                            <span className="login-error-text">
                              {confirmPasswordError}
                            </span>
                          )}

                          {successMessage && (
                            <div className="forgotpassword-success-message">
                              {successMessage}
                            </div>
                          )}
                          {generalError && (
                            <div className="forgotpassword-error-message">
                              {generalError}
                            </div>
                          )}

                          <div className="modal-buttons-profile">
                            <button
                              type="button"
                              onClick={() => {
                                setShowPasswordModal(false);
                                setCurrentPassword("");
                                setNewPassword("");
                                setConfirmPassword("");
                                setTouched({
                                  newPassword: false,
                                  confirmPassword: false,
                                });
                                setNewPasswordError("");
                                setConfirmPasswordError("");
                                setGeneralError("");
                                setSuccessMessage("");
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={
                                !currentPassword ||
                                !newPassword ||
                                !confirmPassword ||
                                !!newPasswordError ||
                                !!confirmPasswordError ||
                                newPassword !== confirmPassword
                              }
                            >
                              Confirm
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                  {showConfirmModal && (
                    <div className="modal-overlay-confirm-change">
                      <div className="modal-content-confirm-change">
                        <h3>Confirm Password Change</h3>
                        <p>Are you sure you want to change your password?</p>
                        <div className="modal-buttons-confirm-change">
                          <button onClick={() => setShowConfirmModal(false)}>
                            Cancel
                          </button>
                          <button onClick={submitPasswordChange}>
                            Confirm
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="profile-info">
                  <div className="profile-info-header">
                    <h2>Personal Information</h2>
                    <button className="edit-info-btn" onClick={handleEditInfo}>
                      <FontAwesomeIcon icon={faPenToSquare} /> Edit Info
                    </button>
                  </div>
                  <div className="info-field">
                    <label>
                      Full Name: <span id="full-name" ref={fullNameRef}></span>
                    </label>
                  </div>
                  <div className="info-field">
                    <label>
                      Email: <span id="email" ref={emailRef}></span>
                    </label>
                  </div>
                  <div className="info-field">
                    <label>
                      Role: <span id="email" ref={roleRef}></span>
                    </label>
                  </div>
                  <div className="info-field">
                    <label>
                      Age: <span id="age" ref={ageRef}></span>
                    </label>
                  </div>
                  <div className="info-field">
                    <label>
                      Address: <span id="address" ref={addressRef}></span>
                    </label>
                  </div>
                  <div className="info-field">
                    <label>
                      Created At:{" "}
                      <span id="created-at" ref={createdAtRef}></span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="space"></div>
            </div>
          </div>
        </div>

        {showEditInfoForm && (
          <div className="modal">
            <div className="modal-content-edit-info">
              <h3>Edit Personal Information</h3>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={editFormData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={editFormData.age}
                  onChange={handleInputChange}
                  placeholder="Enter your age"
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={editFormData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your address"
                />
              </div>
              <div className="modal-buttons">
                <button
                  className="btn-cancel"
                  onClick={() => setShowEditInfoForm(false)}
                >
                  Cancel
                </button>
                <button className="btn-update" onClick={handleUpdateInfo}>
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {showConfirmForm && (
          <div className="modal">
            <div className="modal-content-confirm">
              <h3>Confirm Update</h3>
              <p>{confirmMessage}</p>
              <div className="modal-buttons">
                <button
                  className="btn-cancel"
                  onClick={() => setShowConfirmForm(false)}
                >
                  Cancel
                </button>
                <button className="btn-confirm" onClick={confirmAction}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const Profile = () => {
  return <ProfileContent />;
};

export default Profile;
