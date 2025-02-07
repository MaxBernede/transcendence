import React, { useContext, useEffect } from 'react';
import AddFriend from '../components/friends/addFriend';
import FriendsSheet from '../components/friends/friends';
import BlockUser from '../components/friends/blockUser';

const Friends: React.FC = () => {
  return (
	<div className='min-h-screen pt-20'>
		<div className="flex justify-center space-x-4">
		<AddFriend />
		<BlockUser />
		</div>
		<FriendsSheet></FriendsSheet>
	</div>
  );
};

export default Friends;