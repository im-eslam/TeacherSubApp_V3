import { useMemo, useState } from "react";
import {
  Button,
  ComboBox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  type Key,
} from "react-aria-components";

export interface ScheduleSearchOption {
  value: string;
  label: string;
}

interface ScheduleSearchableSelectProps {
  label: string;
  options: ScheduleSearchOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isDisabled?: boolean;
}

export function ScheduleSearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  isDisabled = false,
}: ScheduleSearchableSelectProps) {
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );
  const [typedValue, setTypedValue] = useState<string | null>(null);
  const inputValue = typedValue ?? selectedOption?.label ?? "";

  return (
    <ComboBox
      className="flex flex-col gap-1.5"
      selectedKey={value || null}
      onSelectionChange={(key: Key | null) => {
        setTypedValue(null);
        onChange(key == null ? "" : String(key));
      }}
      inputValue={inputValue}
      onInputChange={(nextValue) => {
        setTypedValue(nextValue);
        if (!nextValue) onChange("");
      }}
      isDisabled={isDisabled}
      allowsEmptyCollection
      defaultFilter={(textValue, query) =>
        textValue.toLocaleLowerCase("ar").includes(query.toLocaleLowerCase("ar"))
      }
    >
      <Label className="text-xs font-semibold text-neutral-500">{label}</Label>
      <div className="flex items-center rounded-xl border border-neutral-200 bg-white shadow-sm transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
        <Input
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:text-neutral-400"
          placeholder={placeholder}
          aria-label={label}
        />
        <Button
          aria-label="فتح قائمة الاختيارات"
          className="px-3 text-neutral-400 outline-none focus-visible:text-blue-600"
        >
          <span aria-hidden="true">⌄</span>
        </Button>
      </div>
      <Popover className="w-[--trigger-width] overflow-hidden rounded-xl border border-neutral-200 bg-white p-1 shadow-xl outline-none">
        <ListBox
          items={options}
          className="max-h-64 overflow-auto outline-none"
          renderEmptyState={() => (
            <div className="px-3 py-4 text-center text-sm text-neutral-500">
              لا توجد نتائج مطابقة
            </div>
          )}
        >
          {(option) => (
            <ListBoxItem
              id={option.value}
              textValue={option.label}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm text-neutral-700 outline-none data-[focused]:bg-blue-50 data-[focused]:text-blue-700 data-[selected]:bg-blue-100 data-[selected]:font-semibold"
            >
              {option.label}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}
