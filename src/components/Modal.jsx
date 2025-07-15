import React from "react";
import "./Modal.css"; // You can also add this in your main styles.css if preferred

const Modal = ({ isOpen, title, content, onCancel, onSave }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>{title}</h3>
        <div className="modal-content">{content}</div>
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-save" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
