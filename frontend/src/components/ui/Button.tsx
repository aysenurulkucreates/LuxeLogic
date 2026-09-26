import React from "react";
import { Loader2, type LucideIcon } from "lucide-react";

// Birincil aksiyon stili. Link gibi <button> olmayan öğeler de aynı görünümü
// kullanabilsin diye ayrıca dışa aktarılıyor.
export const primaryButtonClasses =
  "inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  icon: Icon,
  isLoading = false,
  type = "button",
  disabled,
  className = "",
  children,
  ...rest
}) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${primaryButtonClasses} ${className}`}
      {...rest}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Icon size={16} />
      )}
      {children}
    </button>
  );
};

export default Button;
