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

