import type { ReactNode } from "react";
import { Heading, Button } from "react-aria-components";
import { AlertCircle, X } from "lucide-react";

// ════════════════════════════════════════════════════════════
// Styles
// ════════════════════════════════════════════════════════════

const STYLES = {
  header:
    "flex items-center justify-between px-6 py-4 border-b border-neutral-200/60 shrink-0",
  title: "text-[15px] font-semibold tracking-tight text-neutral-900",
  closeButton:
    "flex items-center justify-center w-8 h-8 min-w-[44px] min-h-[44px] -me-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] outline-none disabled:opacity-50",

  body: "px-6 py-6 flex flex-col gap-4 overflow-flow",

  errorBanner:
    "flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 leading-relaxed",

  footer:
    "flex items-center justify-end gap-2 px-6 py-4 border-t border-neutral-200/60 bg-neutral-50/50 shrink-0 rounded-b-3xl",

  cancelButton:
    "px-4 py-2.5 min-h-[44px] text-sm font-medium text-neutral-600 bg-transparent hover:bg-neutral-100 rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] outline-none disabled:opacity-50",

  primaryButton:
    "px-5 py-2.5 min-h-[44px] text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] outline-none",

  destructiveButton:
    "flex items-center gap-1.5 px-5 py-2.5 min-h-[44px] text-sm font-medium text-white bg-red-500 rounded-full hover:bg-red-600 disabled:opacity-50 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] outline-none",
};

// ════════════════════════════════════════════════════════════
// ModalHeader — title + close (×) button
// ════════════════════════════════════════════════════════════

interface ModalHeaderProps {
  title: string;
  isBusy: boolean;
  onClose: () => void;
}

export function ModalHeader({ title, isBusy, onClose }: ModalHeaderProps) {
  return (
    <div className={STYLES.header}>
      <Heading slot="title" className={STYLES.title}>
        {title}
      </Heading>
      <Button
        type="button"
        isDisabled={isBusy}
        onPress={onClose}
        aria-label="إغلاق"
        className={STYLES.closeButton}
      >
        <X size={18} strokeWidth={2} />
      </Button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ModalBody — scrollable content area
// ════════════════════════════════════════════════════════════

export function ModalBody({ children }: { children: ReactNode }) {
  return <div className={STYLES.body}>{children}</div>;
}

// ════════════════════════════════════════════════════════════
// ModalErrorBanner — shown when a submit/delete call throws
// ════════════════════════════════════════════════════════════

export function ModalErrorBanner({ message }: { message: string }) {
  return (
    <div className={STYLES.errorBanner}>
      <AlertCircle size={15} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ModalFooter — Cancel + primary/destructive action
// ════════════════════════════════════════════════════════════

interface ModalFooterProps {
  isBusy: boolean;
  onCancel: () => void;
  submitLabel: string;
  busyLabel: string;
  variant?: "primary" | "destructive";
  submitDisabled?: boolean;
  icon?: ReactNode;
}

export function ModalFooter({
  isBusy,
  onCancel,
  submitLabel,
  busyLabel,
  variant = "primary",
  submitDisabled = false,
  icon,
}: ModalFooterProps) {
  return (
    <div className={STYLES.footer}>
      <Button
        type="button"
        isDisabled={isBusy}
        onPress={onCancel}
        className={STYLES.cancelButton}
      >
        إلغاء
      </Button>
      <Button
        type="submit"
        isDisabled={isBusy || submitDisabled}
        className={
          variant === "destructive"
            ? STYLES.destructiveButton
            : STYLES.primaryButton
        }
      >
        {icon}
        {isBusy ? busyLabel : submitLabel}
      </Button>
    </div>
  );
}
