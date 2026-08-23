import { DatePicker } from "./DatePicker";
import type { ReportDateRange } from "../../features/reports/types";
import { getRangeError } from "../../features/reports/utils";

interface DateRangePickerProps {
  value: ReportDateRange;
  onChange: (range: ReportDateRange) => void;
  disabled?: boolean;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  disabled = false,
  className = "",
}: DateRangePickerProps) {
  const rangeError = getRangeError(value);

  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <DatePicker
          label="من تاريخ"
          value={value.from}
          onChange={(from) => onChange({ ...value, from })}
          disabled={disabled}
          required
        />
        <DatePicker
          label="إلى تاريخ"
          value={value.to}
          onChange={(to) => onChange({ ...value, to })}
          disabled={disabled}
          required
        />
      </div>
      {rangeError && (
        <p className="text-xs font-medium text-red-600" role="alert">
          {rangeError}
        </p>
      )}
    </div>
  );
}
