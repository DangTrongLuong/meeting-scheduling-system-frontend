import React, { useState } from "react";
import "../../../styles/Device/AddDeviceModal.css";

const AddDeviceModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    quantity: 0,
    active: true,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Device name is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/admin/devices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save device");
      }

      const savedDevice = await response.json();
      onClose(); // Close modal
    } catch (error) {
      console.error("Error saving device:", error);
      alert("Error saving device. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <h2>Add Device</h2>
        <form onSubmit={handleSubmit} className="device-form">
          {/* Device Name */}
          <label>Device Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter device name..."
            required
            className="input-field"
          />

          {/* Quantity */}
          <label>Quantity</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="0"
            className="input-field"
          />

          {/* Active Status */}
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleChange}
            /> Active
          </label>

          {/* Actions */}
          <div className="modal-actions">
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDeviceModal;