import React, { useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../App'; // Import UserContext

interface Remove2FAButtonProps {
  className?: string;
}

const Remove2FAButton: React.FC<Remove2FAButtonProps> = ({ className }) => {
  const { userData, setUserData } = useContext(UserContext); // Use context to get user data

  const handleRemove2FA = async () => {
    if (userData?.id) {
      try {
        const token = localStorage.getItem('jwt'); // JWT token from localStorage
        const response = await axios.put(
          `http://localhost:3000/api/users/${userData.id}`,
          { secret_2fa: null }, // Set secret_2fa to null
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Update userData in state after the successful update
        setUserData({ ...userData, secret_2fa: null });
        console.log('2FA secret removed:', response.data);
      } catch (err) {
        console.error('Error removing 2FA secret', err);
      }
    }
  };

  if (!userData?.secret_2fa) {
    return null; // Don't render the button if 2FA is not enabled
  }

  return (
    <button onClick={handleRemove2FA} className={className || 'btn btn-danger'}>
      Remove 2FA
    </button>
  );
};

export default Remove2FAButton;
