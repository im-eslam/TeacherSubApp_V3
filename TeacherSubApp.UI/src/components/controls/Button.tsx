import {
  Button as AriaButton,
  composeRenderProps,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";

const STYLES = {
  base: "inline-flex items-center justify-center gap-2 min-h-[44px] font-medium transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] outline-none disabled:opacity-50",

  variant: {
    primary:
      "px-6 py-2.5 text-sm text-white bg-blue-600 rounded-full hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500/30",
    secondary:
      "px-5 py-2.5 text-sm text-neutral-700 bg-white border border-neutral-200/80 rounded-full hover:bg-neutral-50 hover:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-500/30",
    quiet:
      "px-4 py-2.5 text-sm text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-full focus-visible:ring-2 focus-visible:ring-neutral-200",
    destructive:
      "px-5 py-2.5 text-sm text-white bg-red-500 rounded-full hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-red-500/30",
  },

  pressed: "scale-[0.98]",
};

// ════════════════════════════════════════════════════════════
// Button
// ════════════════════════════════════════════════════════════
// Usage:
//   <Button variant="primary" onPress={onAdd}>
//     <Plus size={18} strokeWidth={2.5} />
//     إضافة مادة
//   </Button>
//
//   <Button variant="quiet" onPress={onClearFilters}>
//     <X size={16} strokeWidth={2.5} />
//     إلغاء التصفية
//   </Button>
// ════════════════════════════════════════════════════════════

interface ButtonProps extends AriaButtonProps {
  variant?: keyof typeof STYLES.variant;
}

export function Button({ variant = "primary", ...rest }: ButtonProps) {
  return (
    <AriaButton
      {...rest}
      className={composeRenderProps(
        rest.className,
        (className, { isPressed }) =>
          [
            STYLES.base,
            STYLES.variant[variant],
            isPressed ? STYLES.pressed : "",
            className,
          ]
            .filter(Boolean)
            .join(" "),
      )}
    />
  );
}
