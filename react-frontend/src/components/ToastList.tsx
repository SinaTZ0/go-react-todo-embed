import { type Toast } from '../hooks/useTodos';

interface ToastListProps {
  toasts: Toast[];
  onRemoveToast: (id: number) => void;
}

export function ToastList({ toasts, onRemoveToast }: ToastListProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <span className="toast-content">{toast.message}</span>
          <button className="toast-close" onClick={() => onRemoveToast(toast.id)}>
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
