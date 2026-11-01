import { AlertCircle } from 'lucide-react';

export function StepIntroduction({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-xl font-serif font-bold text-[#1E2922]">{title}</h2>
      <p className="text-xs sm:text-sm text-[#64746D] mt-1">{description}</p>
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} className="text-xs text-[#C0392B] mt-1 flex items-center space-x-1">
      <AlertCircle className="w-3.5 h-3.5" />
      <span>{message}</span>
    </p>
  );
}
