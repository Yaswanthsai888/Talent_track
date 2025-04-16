import React from 'react';
import PropTypes from 'prop-types';
const baseStyles = "px-6 py-3 text-lg font-semibold rounded-lg transition-all duration-300 ease-in-out relative overflow-hidden shadow-md";
const variants = {
  primary: "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700",
  secondary: "bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 text-white hover:from-gray-800 hover:via-gray-900 hover:to-black",
  outline: "border border-gray-300/50 text-gray-200 bg-gradient-to-br from-gray-800/10 to-gray-900/10 hover:from-gray-700/20 hover:to-gray-800/20",
  success: 'bg-green-600 hover:bg-green-700 text-white',
};
const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  onClick, 
  type = 'button', 
  disabled = false,
  icon: Icon 
}) => {
  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:scale-105 active:scale-95'} before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:scale-x-0 before:origin-left before:transition-transform before:duration-500 hover:before:scale-x-100`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="relative z-10 flex items-center justify-center">
        {Icon && <Icon className="mr-2 inline-block transition-transform duration-300 group-hover:translate-x-1" />}
        <span className="relative inline-block">
          {children}
          <span className="absolute inset-0 -z-10 bg-gradient-to-t from-transparent to-white/5 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg" />
        </span>
      </span>
      {!disabled && (
        <span className="absolute inset-0 -z-10 bg-gradient-to-br from-white/10 to-transparent opacity-0 hover:opacity-30 transition-opacity duration-500 rounded-lg" />
      )}
    </button>
  );
};
Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(Object.keys(variants)),
  className: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  disabled: PropTypes.bool,
  icon: PropTypes.elementType
};
export default Button;

