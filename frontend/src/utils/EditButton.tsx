// EditableFieldButton.tsx
import React, { useState } from 'react';

interface EditableFieldButtonProps {
  field: string;
  currentValue: string;
  onSave: (field: string, value: string) => void; // The function to call on save
}

const EditableFieldButton: React.FC<EditableFieldButtonProps> = ({ field, currentValue, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newValue, setNewValue] = useState(currentValue);

  const handleSave = () => {
    onSave(field, newValue);
    setIsEditing(false); // Exit edit mode
  };

  return (
    <div>
      {isEditing ? (
        <div>
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div>
          <p>{field}: {currentValue}</p>
          <button onClick={() => setIsEditing(true)}>Edit {field}</button>
        </div>
      )}
    </div>
  );
};

export default EditableFieldButton;
