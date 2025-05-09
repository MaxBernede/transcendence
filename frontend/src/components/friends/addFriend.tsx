import React, { useState, useContext } from "react";
import ButtonComponent from "../../utils/ButtonCompo";
import InputComponent from "../../utils/InputCompo";
import ErrorMessage from "../../utils/ErrorMessage";
import { UserContext } from '../../App';

type AddFriendProps = {};

const AddFriend: React.FC<AddFriendProps> = () => {
	const [friend, setFriend] = useState("");
	const { userData } = useContext(UserContext);
	const [errorMessage, setErrorMessage] = useState<string | null>(null); // State for error message
	
	const addFriend = async () => {
		console.log("addFriend function triggered with input:", friend); // ✅ Log input value

		if (!friend) return;  // Ensure the friend field is not empty
		try {
		  // Make the POST request to the API
		  const response = await fetch(`${process.env.REACT_APP_BACKEND_IP}/friends/addFriends`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
			  mainId: userData?.id,
			  friendUsername: friend,
			  action: 'request'
			}),
			credentials: 'include', // include this if your backend uses cookies
		  });
	
		  if (response.ok) {
			alert('Friend added successfully!');
			setFriend('');
			setErrorMessage(null)
			window.location.reload();
		} 
		  else {
			const data = await response.json();
        	setErrorMessage(data.message || 'Failed to add friend');
		  }
		} 
		catch (error) {
			setErrorMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
		}
	  };

	return (
		<div className="flex items-center justify-center">
			<div className="p-6 w-96 text-center shadow-lg border rounded-lg">
				<h2 className="text-xl font-semibold mb-4">Add a Friend</h2>
				<InputComponent
					value={friend}
					onChange={(e) => setFriend(e.target.value)}
					placeholder="Enter friend username"
				></InputComponent>
				<ButtonComponent onClick={addFriend}>Add Friend</ButtonComponent>
				{errorMessage && <ErrorMessage message={errorMessage} />}
			</div>
		</div>
	);
};

export default AddFriend;