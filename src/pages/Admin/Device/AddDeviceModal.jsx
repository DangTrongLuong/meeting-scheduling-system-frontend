import React, { useState, useEffect } from "react";
import "../../../styles/Device/AddDeviceModal.css";

const AddDeviceModal = ({ onClose, onSave, isEdit, device }) => {
  const [formData, setFormData] = useState({
    name: "",
    quantity: 0,
    active: true,
  });

  const [loading, setLoading] = useState(false);

  // ✅ Khi edit, load dữ liệu thiết bị vào form
  useEffect(() => {
    if (isEdit && device) {
      setFormData({
        name: device.name,
        quantity: device.quantity,
        active: device.active,
      });
    }
  }, [isEdit, device]);

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
    const url = isEdit
      ? `http://localhost:8080/api/admin/devices/${device.id}`
      : "http://localhost:8080/api/admin/devices";

    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    
if (!response.ok) {
    const errorText = await response.text();
    alert(errorText.includes("Device name already exists")
        ? "Tên thiết bị đã tồn tại. Vui lòng chọn tên khác."
        : "Có lỗi xảy ra. Vui lòng thử lại.");
    return;
}


    await response.json();
    if (onSave) onSave();
    onClose();
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
        <h2>{isEdit ? "Edit Device" : "Add Device"}</h2>
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
            />{" "}
            Active
          </label>

          {/* Actions */}
          <div className="modal-actions">
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update" : "Save"}
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