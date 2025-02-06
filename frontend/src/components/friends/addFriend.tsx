import { useState } from "react";
import ButtonComponent from "../../utils/ButtonCompo";

type AddFriendProps = {};

const AddFriend: React.FC<AddFriendProps> = () => {
	const [friend, setFriend] = useState("");

	const addFriend = async () => {
		if (!friend) return;
		try {
			const response = await fetch("/api/add-friend", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ friend })
			});
			if (response.ok) {
				alert("Friend added successfully!");
				setFriend("");
			} else {
				alert("Failed to add friend");
			}
		} catch (error) {
			alert("Error: " + (error instanceof Error ? error.message : "Unknown error"));
		}
	};

	return (
		<div className="flex items-center justify-center h-screen">
			<div className="p-6 w-96 text-center shadow-lg border rounded-lg">
				<h2 className="text-xl font-semibold mb-4">Add a Friend</h2>
				<input
					type="text"
					value={friend}
					onChange={(e) => setFriend(e.target.value)}
					placeholder="Enter friend username"
					className="mb-4 w-full p-2 border rounded"
				/>
				<ButtonComponent onClick={addFriend}>Add Friend</ButtonComponent>
			</div>
		</div>
	);
};

export default AddFriend;