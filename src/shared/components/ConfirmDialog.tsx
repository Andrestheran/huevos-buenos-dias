import { ReactNode } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary',
  isLoading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-slide-in-up">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="text-6xl">
              {variant === 'danger' ? '⚠️' : 'ℹ️'}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-neutral-900 text-center mb-2">
            {title}
          </h2>

          {/* Message */}
          <div className="text-neutral-600 text-center mb-6">
            {message}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={variant}
              fullWidth
              onClick={onConfirm}
              isLoading={isLoading}
              disabled={isLoading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
