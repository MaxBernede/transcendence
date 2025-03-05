import React, { useState } from 'react';
import '../styles/EditableFieldButton.css'; // Add custom CSS for styling

interface EditableFieldButtonProps {
  field: string;
  currentValue: string;
  onSave: (field: string, value: string) => void;
}

const EditableFieldButton: React.FC<EditableFieldButtonProps> = ({ field, currentValue, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newValue, setNewValue] = useState(currentValue);

  const handleSave = () => {
    onSave(field, newValue);
    setIsEditing(false);
  };

  return (
    <div className="editable-field-container">
      {isEditing ? (
        <div className="editing-mode">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="editable-input"
          />
          <button className="save-btn" onClick={handleSave}>Save</button>
          <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div className="view-mode">
          <p className="field-value">
            <strong>{field}:</strong> {currentValue}
          </p>
          <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit</button>
        </div>
      )}
    </div>
  );
};

export default EditableFieldButton;
