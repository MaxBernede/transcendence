import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';

const Navbar = () => {
	return (
		<nav className={styles.navbar}>
			<Link to="/" className={styles.navLink}>Home</Link>
			<Link to="/user/me" className={styles.navLink}>Me</Link>
			<Link to="/creation" className={styles.navLink}>Creation</Link>
		</nav>
	);
};

export default Navbar;
