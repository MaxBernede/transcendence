type ButtonComponentProps = {
	onClick: () => void;
	children: React.ReactNode;
};

const ButtonComponent: React.FC<ButtonComponentProps> = ({ onClick, children }) => {
	return (
		<button onClick={onClick} className="bg-blue-500 text-white p-2 rounded">
			{children}
		</button>
	);
};

export default ButtonComponent;

// This button can be use to call any function with the correct css already