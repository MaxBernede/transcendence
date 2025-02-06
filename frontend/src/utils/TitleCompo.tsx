// TitleComponent.tsx
import React from 'react';

interface TitleComponentProps {
    children: React.ReactNode;
}

const TitleComponent: React.FC<TitleComponentProps> = ({ children }) => (
    <h1 style={{
        fontSize: '24px',
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: '20px',
        textTransform: 'uppercase', 
        letterSpacing: '1px',
        fontFamily: 'Arial, sans-serif'
    }}>
        {children}
    </h1>
);

export default TitleComponent;
