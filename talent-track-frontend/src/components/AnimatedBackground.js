import React from 'react';
import PropTypes from 'prop-types';

const AnimatedBackground = ({ 
  children, 
  className = '', 
  variant = 'default' 
}) => {
  const variantClasses = {
    default: 'from-blue-500 via-purple-500 to-indigo-600',
    alternate: 'from-green-400 via-blue-500 to-purple-600'
  };

  return (
    <div className={`relative min-h-screen flex items-center justify-center ${className}`}>
      <div 
        className={`absolute inset-0 bg-gradient-to-r ${variantClasses[variant]} 
                    animate-gradient opacity-70`}
      ></div>
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
};

AnimatedBackground.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'alternate'])
};

export default AnimatedBackground;
