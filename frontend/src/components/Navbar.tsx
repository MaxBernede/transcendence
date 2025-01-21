import React, {useState, useEffect} from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';
import axios from 'axios';
import useAuth from '../utils/useAuth';

const Navbar: React.FC = () => {
	const { isAuthenticated, isLoading } = useAuth();

	// If still loading or not authenticated, do not render the navbar
	if (isLoading || !isAuthenticated) {
		return null;
	}

	return (
		<nav className={`${styles.navbar} fixed top-0 left-0 w-full z-50 bg-gray-900 text-white p-4 shadow-md`} >
			<Link to="/" className={styles.navLink}>Home</Link>
			<Link to="/creation" className={styles.navLink}>Creation</Link>
			<Link to="/2FA" className={styles.navLink}>2FA (remove it later)</Link>
			<Link to="/chat" className={styles.navLink}>Chat</Link>
			<Link to="/pong">Pong Game</Link> 
			<div className={styles.navRight}>
				<Link to="/user/profileupdate" className={styles.navLink}>⚙️ Edit</Link>
				<Link to="/user/me" className={styles.navLink}>My Profile</Link>
			</div>
	</nav>
	);
  };

export default Navbar;
