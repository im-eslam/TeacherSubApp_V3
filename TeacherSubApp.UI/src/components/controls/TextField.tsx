import {
  TextField as AriaTextField,
  Label,
  Input,
  composeRenderProps,
  type TextFieldProps,
} from "react-aria-components";

const STYLES = {
  root: "flex flex-col",
  label: "block text-xs font-medium text-neutral-500 mb-1.5",
  input:
    "w-full ps-11 pe-11 py-2.5 min-h-[44px] text-sm text-neutral-900 bg-white border border-neutral-200/80 rounded-full placeholder:text-neutral-400 outline-none transition-colors duration-150 hover:border-blue-300 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 [&::-webkit-search-cancel-button]:hidden",
};

// ════════════════════════════════════════════════════════════
// TextField
// ════════════════════════════════════════════════════════════
// Usage:
//   <TextField
//     label="اسم المادة"
//     value={name}
//     onChange={setName}
//     placeholder="مثال: الرياضيات"
//     autoFocus
//   />
// ════════════════════════════════════════════════════════════

interface AppTextFieldProps extends Omit<TextFieldProps, "children"> {
  label: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function TextField({
  label,
  placeholder,
  autoFocus,
  ...rest
}: AppTextFieldProps) {
  return (
    <AriaTextField
      {...rest}
      className={composeRenderProps(rest.className, (className) =>
        [STYLES.root, className].filter(Boolean).join(" "),
      )}
    >
      <Label className={STYLES.label}>{label}</Label>
      <Input
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={STYLES.input}
      />
    </AriaTextField>
  );
}
