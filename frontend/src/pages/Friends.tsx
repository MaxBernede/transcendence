import React, { useContext, useEffect } from 'react';
import TwoFactorAuth from '../components/2FA/2FA';
import { UserContext } from '../App'; // Import UserContext
import { fetchUserData } from '../utils/UserLogic';
import AddFriend from '../components/friends/addFriend';
import FriendsSheet from '../components/friends/friends';

const Friends: React.FC = () => {

  const { userData, setUserData, loading, error, achievements, setAchievements, matchHistory, setMatchHistory } = useContext(UserContext); // Use context

  useEffect(() => {
	if (!userData) {
	  // If userData is not available, fetch it
	  fetchUserData(setUserData, setAchievements, setMatchHistory, () => {}, () => {});
	}
  }, [userData, setUserData, setAchievements, setMatchHistory]);

  return (
	<div className='min-h-screen pt-20'>
		<AddFriend></AddFriend>
		<FriendsSheet></FriendsSheet>
	</div>
  );
};

export default Friends;