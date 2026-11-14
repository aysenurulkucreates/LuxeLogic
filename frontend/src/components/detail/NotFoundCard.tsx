import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";

interface NotFoundCardProps {
  title: string;
  backLabel: string;
  backUrl: string;
}

const NotFoundCard: React.FC<NotFoundCardProps> = ({
  title,
  backLabel,
  backUrl,
}) => {
  const navigate = useNavigate();
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <Button icon={ArrowLeft} onClick={() => navigate(backUrl)}>
          {backLabel}
        </Button>
      </div>
    </div>
  );
};

export default NotFoundCard;
