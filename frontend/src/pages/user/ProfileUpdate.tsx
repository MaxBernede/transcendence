import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ProfileUpdate: React.FC = () => {
	const [formData, setFormData] = useState({
		username: '',
		email: '',
		firstName: '',
		lastName: '',
	});

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	// Fetch current user data
	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const response = await axios.get('/api/user/me', { withCredentials: true });
				setFormData({
					username: response.data.username || '',
					email: response.data.email || '',
					firstName: response.data.firstName || '',
					lastName: response.data.lastName || '',
				});
				setLoading(false);
			} catch (err) {
				setError('Failed to fetch user data.');
				setLoading(false);
			}
		};

		fetchUserData();
	}, []);

	// Handle form input changes
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setSuccess('');

		try {
			await axios.put('/api/user/me', formData, { withCredentials: true });
			setSuccess('Profile updated successfully!');
		} catch (err) {
			setError('Failed to update profile.');
		}
	};

	if (loading) return <p>Loading...</p>;

	return (
		<div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
			<h2>Update Profile</h2>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			{success && <p style={{ color: 'green' }}>{success}</p>}
			<form onSubmit={handleSubmit}>
				<div style={{ marginBottom: '15px' }}>
					<label>Username:</label>
					<input
						type="text"
						name="username"
						value={formData.username}
						onChange={handleChange}
						style={{ width: '100%', padding: '8px', marginTop: '5px' }}
					/>
				</div>
				<div style={{ marginBottom: '15px' }}>
					<label>Email:</label>
					<input
						type="email"
						name="email"
						value={formData.email}
						onChange={handleChange}
						style={{ width: '100%', padding: '8px', marginTop: '5px' }}
					/>
				</div>
				<div style={{ marginBottom: '15px' }}>
					<label>First Name:</label>
					<input
						type="text"
						name="firstName"
						value={formData.firstName}
						onChange={handleChange}
						style={{ width: '100%', padding: '8px', marginTop: '5px' }}
					/>
				</div>
				<div style={{ marginBottom: '15px' }}>
					<label>Last Name:</label>
					<input
						type="text"
						name="lastName"
						value={formData.lastName}
						onChange={handleChange}
						style={{ width: '100%', padding: '8px', marginTop: '5px' }}
					/>
				</div>
				<button
					type="submit"
					style={{
						backgroundColor: '#007bff',
						color: '#fff',
						padding: '10px 20px',
						border: 'none',
						cursor: 'pointer',
					}}
				>
					Update Profile
				</button>
			</form>
		</div>
	);
};

export default ProfileUpdate;
