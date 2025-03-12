import { useState, useContext } from "react";
import ButtonComponent from "../../utils/ButtonCompo";
import InputComponent from "../../utils/InputCompo";
import ErrorMessage from "../../utils/ErrorMessage";
import { UserContext } from '../../App';

type AddFriendProps = {};

const BlockUser: React.FC<AddFriendProps> = () => {
	const [username, setUsername] = useState("");
	const { userData } = useContext(UserContext);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	
	const blockUser = async () => {
		if (!username) return;  // ensure field is not empty
	
		try {
		  // Make the POST request to the API
		  const response = await fetch('friends/blockUser', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				mainId: userData?.id,
				friendUsername: username,
			}),
		  });
	
		  if (response.ok) {
			// alert('User blocked successfully!');
			setUsername('');
			setErrorMessage(null)
			window.location.reload();
		} 
		  else {
			const data = await response.json();
        	setErrorMessage(data.message || 'Failed to block user');
		  }
		} 
		catch (error) {
			setErrorMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
		}
	  };

	return (
		<div className="flex items-center justify-center">
			<div className="p-6 w-96 text-center shadow-lg border rounded-lg">
				<h2 className="text-xl font-semibold mb-4">Block a user</h2>
				<InputComponent
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					placeholder="Enter username to block"
				></InputComponent>
				<ButtonComponent onClick={blockUser}>Block user</ButtonComponent>
				{errorMessage && <ErrorMessage message={errorMessage} />}
			</div>
		</div>
	);
};

export default BlockUser;