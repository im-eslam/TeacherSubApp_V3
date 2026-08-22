import type { ReactNode } from "react";
import {
  ModalOverlay,
  Modal as AriaModal,
  Dialog,
  type ModalOverlayProps,
} from "react-aria-components";

const STYLES = {
  overlay: [
    "fixed inset-0 z-50 flex items-center justify-center p-4",
    "bg-black/50 backdrop-blur-sm",
    "entering:animate-in entering:fade-in entering:duration-200",
    "exiting:animate-out exiting:fade-out exiting:duration-150",
  ].join(" "),

  modal: {
    base: [
      "w-full max-h-[90vh]",
      "bg-white/95 backdrop-blur-xl",
      "border border-neutral-200/60 rounded-3xl shadow-xl",
      "overflow-visible outline-none",
      "entering:animate-in entering:zoom-in-95 entering:fade-in entering:duration-200",
      "exiting:animate-out exiting:zoom-out-95 exiting:fade-out exiting:duration-150",
    ].join(" "),
    md: "max-w-md",
    xl: "max-w-3xl",
    "2xl": "max-w-4xl",
    full: "max-w-[min(96vw,1200px)]",
  },
};

// ════════════════════════════════════════════════════════════
// ModalShell
// ════════════════════════════════════════════════════════════

interface ModalShellProps extends Omit<ModalOverlayProps, "children"> {
  children: ReactNode;
  isBusy?: boolean;
  size?: "md" | "xl" | "2xl" | "full";
}

export function ModalShell({
  children,
  isBusy = false,
  size = "md",
  isOpen,
  onOpenChange,
  ...rest
}: ModalShellProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open && isBusy) return;
    onOpenChange?.(open);
  };

  return (
    <ModalOverlay
      {...rest}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      isDismissable={!isBusy}
      className={STYLES.overlay}
    >
      <AriaModal className={[STYLES.modal.base, STYLES.modal[size]].join(" ")}>
        <Dialog
          className="outline-none flex flex-col max-h-[90vh] overflow-visible"
          dir="rtl"
        >
          {children}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}
