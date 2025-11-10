import React, { useState } from "react";
import Select from "react-select";
import "../styles/AddDeviceModal.css";

const AddDeviceModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    quantity: 0,
    active: true,
    type: "",
  });

  const deviceSuggestions = [
    { value: "Máy chiếu", label: "Máy chiếu" },
    { value: "Loa", label: "Loa" },
    { value: "Micro", label: "Micro" },
    { value: "Laptop", label: "Laptop" },
    { value: "Camera", label: "Camera" },
    { value: "Màn hình", label: "Màn hình" },
    { value: "Router", label: "Router" },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleTypeChange = (selectedOption) => {
    setFormData({ ...formData, type: selectedOption ? selectedOption.value : "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Device name is required");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <h2>Add Device</h2>
        <form onSubmit={handleSubmit}>
          <label>Device Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nhập tên thiết bị..."
            required
          />

          <label>Device Type</label>
          <Select
            options={deviceSuggestions}
            onChange={handleTypeChange}
            placeholder="Tìm hoặc chọn loại thiết bị..."
            isClearable
          />

          <label>Quantity</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="0"
          />

          <label>
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleChange}
            /> Active
          </label>

          <div className="modal-actions">
            <button type="submit" className="btn-save">Save</button>
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDeviceModal;