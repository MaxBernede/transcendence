// components/FriendsList.tsx

import { useEffect, useState } from 'react';

interface Friend {
  friend_id: number;
  name: string;
  status: string;
}

const FriendsList = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await fetch('http://localhost:3000/me/friends');
		console.log(response);
        if (!response.ok) {
          throw new Error('Failed to fetch friends');
        }
        const data: Friend[] = await response.json();
        setFriends(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  if (loading) {
    return <div>Loading friends...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Your Friends</h2>
      <ul>
        {friends.map((friend) => (
          <li key={friend.friend_id}>
            <p>{friend.name} ({friend.status})</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FriendsList;
