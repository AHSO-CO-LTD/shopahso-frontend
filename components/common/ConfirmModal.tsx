"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive";
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  confirmVariant = "destructive",
  isLoading = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isLoading) {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isLoading, onCancel, open]);

  if (typeof document === "undefined" || !open) {
    return null;
  }

  return createPortal(
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 px-4"
      role="dialog"
    >
      <div className="w-full max-w-md border border-border bg-background">
        <div className="space-y-2 border-b border-border px-6 py-5">
          <h3 className="text-xl font-black tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4">
          <Button
            className="h-10 cursor-pointer px-4 text-sm font-semibold"
            disabled={isLoading}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            {cancelText}
          </Button>
          <Button
            className="h-10 cursor-pointer px-4 text-sm font-semibold"
            disabled={isLoading}
            onClick={() => void onConfirm()}
            type="button"
            variant={confirmVariant}
          >
            {isLoading ? "Đang xử lý..." : confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
