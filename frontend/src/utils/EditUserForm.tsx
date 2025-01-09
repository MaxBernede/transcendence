import React from 'react';

type Props = {
	newUsername: string;
	setNewUsername: (value: string) => void;
	onSave: () => void;
	onCancel: () => void;
};

const EditUserForm: React.FC<Props> = ({ newUsername, setNewUsername, onSave, onCancel }) => {
	return (
		<div className="edit-user-container">
			<input
				type="text"
				value={newUsername}
				onChange={(e) => setNewUsername(e.target.value)}
				placeholder="Enter new username"
			/>
			<button onClick={onSave}>Save</button>
			<button onClick={onCancel}>Cancel</button>
		</div>
	);
};

export default EditUserForm;
