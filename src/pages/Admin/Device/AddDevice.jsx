import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/Device/AddDevice.css";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import { ArrowLeft, Upload, X } from "lucide-react";

const AddDevice = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("devices");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    quantity: 0,
    status: "ACTIVE",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const API_URL = "http://localhost:8080/api/admin/devices";
  const token = localStorage.getItem("accessToken");

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Device name is required";
    }

    if (formData.quantity < 0) {
      newErrors.quantity = "Quantity must be >= 0";
    }

    if (!imageFile) {
      newErrors.image = "Device image is required";
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

      if (errors.image) {
        setErrors({ ...errors, image: "" });
      }
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
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
    form.append("image", imageFile);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) throw new Error(await res.text());

      toast.success("Device added successfully!");
      setTimeout(() => {
        navigate("/devices");
      }, 1500);
    } catch (err) {
      toast.error(err.message || "Failed to add device!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/devices");
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
          <div className="create-device-header">
            <button
              onClick={handleCancel}
              className="create-device-btn-back"
              title="Back to list"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="create-device-h1">
              Device Management / Add New Device
            </h1>
          </div>

          <div className="create-device-wrapper">
            <div className="create-device-container">
              <form onSubmit={handleSubmit} className="create-device-form">
                {/* Device Information */}
                <div className="create-device-section">
                  <h2>Device Information</h2>

                  <div className="create-device-group">
                    <label htmlFor="name">
                      Device Name{" "}
                      <span className="create-device-required">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter device name"
                      className={`create-device-input ${
                        errors.name ? "error" : ""
                      }`}
                    />
                    {errors.name && (
                      <span className="create-device-error">{errors.name}</span>
                    )}
                  </div>

                  <div className="create-device-row">
                    <div className="create-device-group">
                      <label htmlFor="quantity">
                        Quantity{" "}
                        <span className="create-device-required">*</span>
                      </label>
                      <input
                        id="quantity"
                        name="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={handleChange}
                        placeholder="Enter quantity"
                        min="0"
                        className={`create-device-input ${
                          errors.quantity ? "error" : ""
                        }`}
                      />
                      {errors.quantity && (
                        <span className="create-device-error">
                          {errors.quantity}
                        </span>
                      )}
                    </div>

                    <div className="create-device-group">
                      <label htmlFor="status">Status</label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="create-device-input"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="MAINTAIN">MAINTAIN</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="create-device-section">
                  <h2>Device Image</h2>
                  <div className="create-device-image-upload">
                    {imagePreview ? (
                      <div className="create-device-image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="create-device-remove-image"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ) : (
                      <label className="create-device-upload-label">
                        <Upload size={40} />
                        <span>Click to upload image</span>
                        <span className="create-device-upload-hint">
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
                  {errors.image && (
                    <span className="create-device-error">{errors.image}</span>
                  )}
                </div>

                <div className="create-device-actions">
                  <button
                    type="submit"
                    className="create-device-btn-submit"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Add Device"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="create-device-btn-cancel"
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

export default AddDevice;
