import {
  Input,
  Label,
  TextField as AriaTextField,
} from "react-aria-components";

export type NumericFieldValue = number | "";

interface NumberFieldProps {
  label: string;
  value: NumericFieldValue;
  onChange: (value: string) => void;
  step?: number | string;
  min?: number;
  max?: number;
  isDisabled?: boolean;
  placeholder?: string;
  helperText?: string;
}

const STYLES = {
  root: "flex flex-col gap-1.5",
  label: "block text-xs font-medium text-neutral-500",
  input:
    "w-full px-4 py-2.5 min-h-[44px] text-sm text-neutral-900 bg-white border border-neutral-200/80 rounded-full placeholder:text-neutral-400 outline-none transition-colors duration-150 hover:border-blue-300 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
  helper: "text-[11px] leading-relaxed text-neutral-400",
};

export function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  isDisabled = false,
  placeholder,
  helperText,
}: NumberFieldProps) {
  return (
    <AriaTextField
      value={value === "" ? "" : String(value)}
      onChange={onChange}
      isDisabled={isDisabled}
      className={STYLES.root}
    >
      <Label className={STYLES.label}>{label}</Label>
      <Input
        type="number"
        step={step}
        min={min}
        max={max}
        inputMode={step === 1 || step === "1" ? "numeric" : "decimal"}
        placeholder={placeholder}
        className={STYLES.input}
      />
      {helperText && <span className={STYLES.helper}>{helperText}</span>}
    </AriaTextField>
  );
}
