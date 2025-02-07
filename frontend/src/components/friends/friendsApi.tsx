// API functions for removing friends, requests, and blocked users

// Remove a friend
export const removeEntity = async (type: string, id: number) => {
    const response = await fetch(`/friends/removeFriend/${id}`, {
      method: 'DELETE',
    });
  
    if (!response.ok) {
      throw new Error(`Failed to remove ${type}`);
    }
  
    return response.json(); // Optionally, return the response message or data if needed
  };
  
export const acceptFriendRequest = async (id: number) => {
    const response = await fetch(`/friends/acceptFriend/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error('Failed to accept friend request');
    }

    return response.json(); // Optionally return any relevant data
};