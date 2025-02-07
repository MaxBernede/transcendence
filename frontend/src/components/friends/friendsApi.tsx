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
  