import React, { useState, useEffect, useContext } from 'react';
import { removeEntity } from './friendsApi';
import ThreeColumnLayout from './friendsColumns';
import { UserContext } from '../../App';
import FriendsList from './friendsList';

const FriendsSheet: React.FC = () => {
	const [friends, setFriends] = useState<any[]>([]);
	const [friendRequests, setFriendRequests] = useState<any[]>([]);
	const [blocked, setBlocked] = useState<any[]>([]);
	const { userData } = useContext(UserContext);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`friends/getFriends/${userData?.id}`);
                if (!response.ok) throw new Error('Failed to fetch friends data');
                
                const data = await response.json();
                setFriends(data.friends || []);
                setFriendRequests(data.requests || []);
                setBlocked(data.blocked || []);
            } catch (error) {
                console.error('Error fetching friends data:', error);
            }
        };
    
        if (userData?.id) {
            fetchData();
        }
    }, [userData]);

    const handleRemoveFriend = async (id: number) => {
        try {
          await removeEntity("Friend", id);
          setFriends(friends.filter(friend => friend.id !== id));
        } catch (error) {
          window.location.reload();
          console.error('Error removing friend:', error);
        }
      };
    
      const handleRemoveRequest = async (id: number) => {
        try {
            await removeEntity("Request", id);
          setFriendRequests(friendRequests.filter(request => request.id !== id));
        } catch (error) {
            window.location.reload();
            console.error('Error removing request:', error);
        }
      };
    
      const handleRemoveBlocked = async (id: number) => {
        try {
            await removeEntity("Blocked", id);
          setBlocked(blocked.filter(user => user.id !== id));
        } catch (error) {
            window.location.reload();
            console.error('Error removing blocked user:', error);
        }
      };

	return (
		<div className="min-h-screen">
			<ThreeColumnLayout>
				<FriendsList title="Friends" items={friends} onRemove={handleRemoveFriend} emoji="🫂" />
				<FriendsList title="Friend Requests" items={friendRequests} onRemove={handleRemoveRequest} emoji="🤝" />
				<FriendsList title="Blocked" items={blocked} onRemove={handleRemoveBlocked} emoji="🚫" />
			</ThreeColumnLayout>
		</div>
	);
};

export default FriendsSheet;
