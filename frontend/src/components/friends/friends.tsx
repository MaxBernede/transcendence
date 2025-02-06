// FriendsSheet.tsx
import React, { useState, useEffect } from 'react';
import { removeFriend, removeRequest, removeBlocked } from './friendsApi'; // Assume you have API functions for removal
import ThreeColumnLayout from './friendsColumns';
// import '../../styles/FriendsSheet.css'; // The CSS file where styles for .card are defined


const FriendsSheet: React.FC = () => {
    const [friends, setFriends] = useState<any[]>([]);
    const [friendRequests, setFriendRequests] = useState<any[]>([]);
    const [blocked, setBlocked] = useState<any[]>([]);

    // Fetch the data (example)
    useEffect(() => {
        const fetchData = async () => {
            // Replace with your actual API calls to get friends, requests, and blocked
            // setFriends(await getFriends());
            // setFriendRequests(await getFriendRequests());
            // setBlocked(await getBlockedUsers());
        };
        
        fetchData();
    }, []);

    // Handle the removal of a friend/request/blocked user
    const handleRemove = async (type: string, id: number) => {
        if (type === 'friend') {
            await removeFriend(id);
            setFriends(friends.filter(friend => friend.id !== id));
        } else if (type === 'request') {
            await removeRequest(id);
            setFriendRequests(friendRequests.filter(request => request.id !== id));
        } else if (type === 'blocked') {
            await removeBlocked(id);
            setBlocked(blocked.filter(user => user.id !== id));
        }
    };

    return (
        <div className="min-h-screen">
            <ThreeColumnLayout>
                <div className="card-column"> 🫂 Friends
                    {friends.map(friend => (
                        <div key={friend.id} className="card">
                            {friend.name}
                            <button onClick={() => handleRemove('friend', friend.id)} className="remove-btn">❌</button>
                        </div>
                    ))}
                </div>

                <div className="card-column"> 🤝 Friends Requests
                    {friendRequests.map(request => (
                        <div key={request.id} className="card">
                            {request.name}
                            <button onClick={() => handleRemove('request', request.id)} className="remove-btn">❌</button>
                        </div>
                    ))}
                </div>

                <div className="card-column"> 🚫 Blocked
                    {blocked.map(user => (
                        <div key={user.id} className="card">
                            {user.name}
                            <button onClick={() => handleRemove('blocked', user.id)} className="remove-btn">❌</button>
                        </div>
                    ))}
                </div>
            </ThreeColumnLayout>
        </div>
    );
};

export default FriendsSheet;
