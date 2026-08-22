import * as React from "react";
import { CalendarDays } from "lucide-react";
import {
  Input,
  Label,
  TextField as AriaTextField,
} from "react-aria-components";
import {
  formatDateAsDayMonthYear,
  parseDayMonthYear,
} from "../dateUtils";

interface LocalizedDateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  labelClassName?: string;
}

export function LocalizedDateInput({
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  labelClassName = "text-xs font-medium text-neutral-500",
}: LocalizedDateInputProps) {
  const [displayValue, setDisplayValue] = React.useState(() =>
    formatDateAsDayMonthYear(value),
  );

  const handleChange = (nextValue: string) => {
    const nextDisplayValue = nextValue.replace(/[^\d/]/g, "").slice(0, 10);
    setDisplayValue(nextDisplayValue);
    const parsedValue = parseDayMonthYear(nextDisplayValue);
    if (parsedValue) onChange(parsedValue);
  };

  return (
    <AriaTextField
      value={displayValue}
      onChange={handleChange}
      isRequired={required}
      className="flex flex-col gap-1.5"
    >
      <Label className={labelClassName}>{label}</Label>
      <div className="relative">
        <CalendarDays
          size={17}
          className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-neutral-400"
          aria-hidden="true"
        />
        <Input
          type="text"
          inputMode="numeric"
          placeholder="DD/MM/YYYY"
          maxLength={10}
          disabled={disabled}
          onBlur={() => setDisplayValue(formatDateAsDayMonthYear(value))}
          className="min-h-[44px] w-full rounded-full border border-neutral-200/80 bg-white ps-11 pe-4 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
        />
      </div>
    </AriaTextField>
  );
}
