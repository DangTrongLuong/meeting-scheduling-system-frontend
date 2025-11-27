import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/Device/EditDevice.css";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import { ArrowLeft, Upload, X } from "lucide-react";

const EditDevice = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("devices");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [currentImagePath, setCurrentImagePath] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    quantity: 0,
    status: "ACTIVE",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const API_URL = "http://localhost:8080/api/admin/devices";
  const token = localStorage.getItem("accessToken");

  // Load device data
  useEffect(() => {
    loadDeviceData();
  }, [id]);

  const loadDeviceData = async () => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load device");
      const data = await res.json();

      setFormData({
        name: data.name,
        quantity: data.totalQuantity,
        status: data.status,
      });
      setCurrentImagePath(data.imagePath);
      setPageLoading(false);
    } catch (err) {
      toast.error(err.message || "Failed to load device data");
      navigate("/admin/devices");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Device name is required";
    }

    if (formData.quantity < 0) {
      newErrors.quantity = "Quantity must be >= 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file!");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB!");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleRemoveCurrentImage = () => {
    setCurrentImagePath(null);
    setImagePreview(null);
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form!");
      return;
    }

    setLoading(true);
    const form = new FormData();
    form.append("name", formData.name);
    form.append("quantity", formData.quantity);
    form.append("status", formData.status);

    if (imageFile) {
      form.append("image", imageFile);
    }

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) throw new Error(await res.text());

      toast.success("Device updated successfully!");
      setTimeout(() => {
        navigate("/admin/devices");
      }, 1200);
    } catch (err) {
      toast.error(err.message || "Failed to update device!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/devices");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleMenuClick = (itemId) => {
    setActiveMenuItem(itemId);
  };

  if (pageLoading) {
    return (
      <div className="my-project-container">
        <NavBar onToggleSidebar={toggleSidebar} />
        <SideBarAdmin
          activeItem={activeMenuItem}
          onItemClick={handleMenuClick}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />
        <div className="main-layout">
          <main className="main-content">
            <div className="edit-device-loading">Loading...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="my-project-container">
      <ToastContainer autoClose={1200} style={{ top: "70px" }} />
      <NavBar onToggleSidebar={toggleSidebar} />
      <SideBarAdmin
        activeItem={activeMenuItem}
        onItemClick={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <div className="main-layout">
        <main className="main-content">
          <div className="edit-device-header">
            <button
              onClick={handleCancel}
              className="edit-device-btn-back"
              title="Back to list"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="edit-device-h1">Device Management / Edit Device</h1>
          </div>

          <div className="edit-device-wrapper">
            <div className="edit-device-container">
              <form onSubmit={handleSubmit} className="edit-device-form">
                {/* Device Information */}
                <div className="edit-device-section">
                  <h2>Device Information</h2>

                  <div className="edit-device-group">
                    <label htmlFor="name">
                      Device Name{" "}
                      <span className="edit-device-required">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter device name"
                      className={`edit-device-input ${
                        errors.name ? "error" : ""
                      }`}
                    />
                    {errors.name && (
                      <span className="edit-device-error">{errors.name}</span>
                    )}
                  </div>

                  <div className="edit-device-row">
                    <div className="edit-device-group">
                      <label htmlFor="quantity">
                        Quantity <span className="edit-device-required">*</span>
                      </label>
                      <input
                        id="quantity"
                        name="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={handleChange}
                        placeholder="Enter quantity"
                        min="0"
                        className={`edit-device-input ${
                          errors.quantity ? "error" : ""
                        }`}
                      />
                      {errors.quantity && (
                        <span className="edit-device-error">
                          {errors.quantity}
                        </span>
                      )}
                    </div>

                    <div className="edit-device-group">
                      <label htmlFor="status">Status</label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="edit-device-input"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="MAINTAIN">MAINTAIN</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="edit-device-section">
                  <h2>Device Image</h2>
                  <div className="edit-device-image-upload">
                    {imagePreview ? (
                      <div className="edit-device-image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="edit-device-remove-image"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ) : currentImagePath ? (
                      <div className="edit-device-image-preview">
                        <img
                          src={`http://localhost:8080${currentImagePath}`}
                          alt="Current"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveCurrentImage}
                          className="edit-device-remove-image"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ) : (
                      <label className="edit-device-upload-label">
                        <Upload size={40} />
                        <span>Click to upload image</span>
                        <span className="edit-device-upload-hint">
                          PNG, JPG up to 5MB
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          hidden
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="edit-device-actions">
                  <button
                    type="submit"
                    className="edit-device-btn-submit"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Device"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="edit-device-btn-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditDevice;
