// InputComponent.tsx
import React from 'react';

interface InputComponentProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    type?: string;
}

const InputComponent: React.FC<InputComponentProps> = ({ value, onChange, placeholder, type = 'text' }) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mb-4 p-2 border rounded text-black placeholder:text-gray-500"
    />
);

export default InputComponent;
