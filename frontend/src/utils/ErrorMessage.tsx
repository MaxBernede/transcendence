import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div
      style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb',
        borderRadius: '5px',
        maxWidth: '400px',
      }}
    >
      <strong>Error: </strong>{message}
    </div>
  );
};

export default ErrorMessage;
