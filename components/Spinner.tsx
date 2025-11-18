
import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-4',
        lg: 'w-16 h-16 border-4',
    };
    return (
        <div className={`${sizeClasses[size]} border-t-transparent border-blue-500 rounded-full animate-spin`}></div>
    );
}

export default Spinner;
