import React, { useContext, useEffect } from 'react';
import AddFriend from '../components/friends/addFriend';
import FriendsSheet from '../components/friends/friends';

const Friends: React.FC = () => {
  return (
	<div className='min-h-screen pt-20'>
		<AddFriend></AddFriend>
		<FriendsSheet></FriendsSheet>
	</div>
  );
};

export default Friends;