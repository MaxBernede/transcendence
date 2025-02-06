// ThreeColumnLayout.tsx
import React from 'react';

interface ThreeColumnLayoutProps {
    children?: React.ReactNode[];
}

const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({ children }) => {
    
	const validChildren = children || [];
	
	return (
        <div className="flex space-x-4 p-6 w-full justify-between">
            <div className="flex-1 p-6 w-96 text-center shadow-lg border rounded-lg">
				{validChildren[0] || <div>No content</div>}
            </div>
            <div className="flex-1 p-6 w-96 text-center shadow-lg border rounded-lg">
                {validChildren[1] || <div>No content</div>}
            </div>
            <div className="flex-1 p-6 w-96 text-center shadow-lg border rounded-lg">
                {validChildren[2] || <div>No content</div>}
            </div>
        </div>
    );
};

export default ThreeColumnLayout;
