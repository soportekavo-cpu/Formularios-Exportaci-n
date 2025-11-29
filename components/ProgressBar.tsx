
import React from 'react';

interface ProgressBarProps {
    progress: number;
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = '' }) => {
    return (
        <div className={`w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden ${className}`}>
            <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            ></div>
        </div>
    );
};
