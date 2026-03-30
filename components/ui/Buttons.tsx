import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  size = 'md', 
  ...props 
}) => {
  const baseStyle = "font-bold uppercase tracking-wide transition-all duration-200 border-2 border-black flex items-center justify-center whitespace-nowrap";
  
  const variants = {
    primary: "bg-lime hover:bg-[#c8cc4e] text-black shadow-cartoon active:translate-x-[2px] active:translate-y-[2px] active:shadow-cartoon-sm rounded-full",
    secondary: "bg-white hover:bg-gray-50 text-black shadow-cartoon active:translate-x-[2px] active:translate-y-[2px] active:shadow-cartoon-sm rounded-full",
    danger: "bg-terracotta hover:bg-[#8a2f1a] text-cream shadow-cartoon active:translate-x-[2px] active:translate-y-[2px] active:shadow-cartoon-sm rounded-full",
    ghost: "bg-transparent border-none shadow-none hover:text-terracotta text-black rounded-lg",
  };

  const sizes = {
    sm: "px-4 py-1 text-xs",
    md: "px-6 py-2 text-sm",
    lg: "px-8 py-3 text-base",
    xl: "px-10 py-4 text-xl",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};