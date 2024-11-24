
import { useParams } from 'react-router-dom';
import React from 'react';

const UserPage: React.FC = () => {
// Use useParams to get the dynamic parameter from the URL
  const { id } = useParams<{ id: string }>();
  console.log('User ID from route:', id); // Debugging

  // Show a loading message if `id` is not yet available
  if (!id) return <p>Loading...</p>;
	
  return (
    <>
      <h1>Hello there, user {id}</h1>
      <p>This is your awesome User Profile page</p>
    </>
  );
};

export default UserPage;