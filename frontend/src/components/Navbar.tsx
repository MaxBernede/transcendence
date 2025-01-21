import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';

const Navbar = () => {
	return (
	  <nav className={`${styles.navbar} fixed top-0 left-0 w-full z-50 bg-gray-900 text-white p-4 shadow-md`}>
		<Link to="/" className={styles.navLink}>Home</Link>
		<Link to="/user/me" className={styles.navLink}>Me</Link>
		<Link to="/creation" className={styles.navLink}>Creation</Link>
		<Link to="/chat" className={styles.navLink}>Chat</Link>
	  </nav>
	);
  };

export default Navbar;
