// api.ts (example for API functions)

export const removeFriend = async (id: number) => {
    await fetch(`/api/friends/${id}`, { method: 'DELETE' });
};

export const removeRequest = async (id: number) => {
    await fetch(`/api/friend-requests/${id}`, { method: 'DELETE' });
};

export const removeBlocked = async (id: number) => {
    await fetch(`/api/blocked/${id}`, { method: 'DELETE' });
};


// // Define the response type (optional, for better type safety)
// interface Friend {
//     id: number;
//     name: string;
// }

// export const getFriends = async (): Promise<Friend[]> => {
//     try {
//         // Send GET request to the backend API
// 		const response = await fetch('http://localhost:3000/getFriends', {
// 			method: 'POST',
// 			headers: { 'Content-Type': 'application/json' },
// 			body: JSON.stringify({
// 				intraId: userId,
// 			}),
// 			credentials: 'include',
// 		});
// 		const data = await response.json();
//         // Assuming the response data contains the list of friends
//         return response.data;
//     } catch (error) {
//         console.error('Error fetching friends:', error);
//         return [];
//     }
// };