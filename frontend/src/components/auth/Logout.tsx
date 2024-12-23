import React from 'react';

const LogoutButton: React.FC = () => {
	// cookies eraser
	const handleLogout = () => {

		document.cookie = 'jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';

		document.cookie = 'userData=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';

		alert('You are unlogged.');

		window.location.reload(); // otherwise old infos on the page

	};

	return (
		<button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#f00', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
			Log Out
		</button>
	);
};

export default LogoutButton;
