import React from "react";

interface LoadingStateProps {
  message?: string;
  layout?: "page" | "modal" | "inline";
}

const LAYOUT_CLASSES: Record<"page" | "modal" | "inline", string> = {
  page: "flex flex-col items-center justify-center min-h-[60vh] max-w-7xl mx-auto px-6 py-16 gap-4",
  modal: "flex flex-col items-center justify-center h-full min-h-96 px-6 py-10 gap-4",
  inline: "flex flex-col items-center justify-center w-full py-12 gap-4",
};

const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  layout = "page",
}) => {
  return (
    <div className={LAYOUT_CLASSES[layout]}>
      <div className="h-10 w-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
      {message && (
        <p className="text-sm text-slate-500 font-medium">{message}</p>
      )}
    </div>
  );
};

export default LoadingState;
