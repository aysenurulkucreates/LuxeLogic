import React from "react";
import { WifiOff, AlertTriangle, LogIn, RotateCw } from "lucide-react";
import { Link } from "react-router-dom";
import { getErrorVariant, type ErrorVariant } from "../../lib/errorVariant";

interface ErrorStateProps {
  error: unknown;
  message?: string;
  onRetry?: () => void;
  layout?: "page" | "modal";
}

const VARIANT_CONFIG: Record<
  ErrorVariant,
  { icon: React.ElementType; title: string; defaultMessage: string }
> = {
  network: {
    icon: WifiOff,
    title: "Connection problem",
    defaultMessage:
      "We couldn't reach the server. Check your internet connection and try again.",
  },
  server: {
    icon: AlertTriangle,
    title: "Something went wrong",
    defaultMessage:
      "An unexpected error occurred while processing your request. Please try again.",
  },
  auth: {
    icon: LogIn,
    title: "Session expired",
    defaultMessage: "Your session has expired. Please log in again to continue.",
  },
};

const LAYOUT_CLASSES: Record<"page" | "modal", string> = {
  page: "flex flex-col items-center justify-center text-center min-h-[60vh] max-w-7xl mx-auto px-6 py-16 space-y-5",
  modal: "flex flex-col items-center justify-center text-center h-full min-h-96 px-6 py-10 space-y-5",
};

const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  message,
  onRetry,
  layout = "page",
}) => {
  const variant = getErrorVariant(error);
  const { icon: Icon, title, defaultMessage } = VARIANT_CONFIG[variant];

  return (
    <div className={LAYOUT_CLASSES[layout]}>
      <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-50 text-indigo-600">
        <Icon size={28} strokeWidth={2} />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          {message ?? defaultMessage}
        </p>
      </div>

      {variant === "auth" ? (
        <Link
          to="/signin"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
        >
          <LogIn size={16} />
          Log in
        </Link>
      ) : (
        onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
          >
            <RotateCw size={16} />
            Retry
          </button>
        )
      )}
    </div>
  );
};

export default ErrorState;
