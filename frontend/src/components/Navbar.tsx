import React, {useState, useEffect} from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';
import axios from 'axios';

const Navbar: React.FC = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
	  // Send a request to verify the token on the server
	  axios.get('/auth/verify', { withCredentials: true })
		.then(response => {
		  setIsAuthenticated(response.data.authenticated); // Set auth status
		})
		.catch(error => {
		  setIsAuthenticated(false); // Set auth status to false if error
		});
	}, []);
  
	// If user is authenticated, show the Navbar
	if (!isAuthenticated) {
	  return null; // Don't render the navbar if not authenticated
	}

	return (
		<nav className={styles.navbar}>
			<Link to="/" className={styles.navLink}>Home</Link>
			<Link to="/creation" className={styles.navLink}>Creation</Link>
			<div className={styles.navRight}>
				<Link to="/user/profileupdate" className={styles.navLink}>⚙️ Edit</Link>
				<Link to="/user/me" className={styles.navLink}>My Profile</Link>
			</div>
	</nav>
	);
};

export default Navbar;
