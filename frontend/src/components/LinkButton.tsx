import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';

const Component = () => {
	const navigate = useNavigate();

	return (
		<div className={'inputContainer'}>
			<Button
				variant="contained"
				color="primary"
				sx={{ marginTop: '20px' }}
				onClick={() => navigate('/2FA')}
			>
				Enable 2FA
			</Button>
		</div>
	);
};

export default Component;