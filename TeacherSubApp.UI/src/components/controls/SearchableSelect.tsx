import {
  Button,
  ComboBox,
  Input,
  ListBox,
  ListBoxItem,
  Popover,
  type Key,
} from "react-aria-components";
import { Check, ChevronDown, Search } from "lucide-react";
import { useState } from "react";
import { isFilterActive } from "../../lib/useFilterState";

const STYLES = {
  root: "relative w-full flex flex-col",
  inputWrap: "relative flex items-center",
  input: [
    "w-full px-4 py-2.5 pe-10 min-h-[44px] border rounded-full text-sm outline-none",
    "transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
    "bg-white border-neutral-200/80 text-neutral-900 hover:border-blue-300",
    "focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500",
  ].join(" "),
  inputActive: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
  searchIcon: "absolute end-3 text-neutral-400 pointer-events-none",
  trigger:
    "absolute end-1 flex items-center justify-center w-9 h-9 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
  chevron: "text-neutral-400 transition-transform duration-200",
  chevronActive: "text-blue-500",
  popover: [
    "w-[--trigger-width] bg-white border border-neutral-200/80 rounded-xl",
    "overflow-hidden p-1 shadow-lg",
    "entering:animate-in entering:fade-in entering:zoom-in-95 entering:duration-150",
    "exiting:animate-out exiting:fade-out exiting:zoom-out-95 exiting:duration-100",
  ].join(" "),
  list: "max-h-64 overflow-auto outline-none flex flex-col gap-0.5",
  item: [
    "flex items-center justify-between w-full px-3 py-2.5 text-sm text-neutral-700 rounded-lg cursor-default select-none outline-none",
    "data-[focused]:bg-blue-50 data-[focused]:text-blue-700",
    "data-[selected]:font-medium data-[selected]:text-blue-700",
    "transition-colors duration-150",
  ].join(" "),
  empty: "px-3 py-6 text-xs text-center text-neutral-400",
};

// ════════════════════════════════════════════════════════════
// Searchable Select
// ════════════════════════════════════════════════════════════
// const [teacher, setTeacher] = useState("");
//
// const teachers = [
//   { value: "1", label: "Ahmed Ali" },
//   { value: "2", label: "Mohamed Hassan" },
//   { value: "3", label: "Omar Mahmoud" },
// ];
//
// <SearchableSelect
//   value={teacher}
//   onChange={setTeacher}
//   options={teachers}
//   placeholder="اختر المدرس"
// />
//
// For a filter:
// <SearchableSelect
//   value={teacherFilter}
//   onChange={setTeacherFilter}
//   options={teachers}
//   placeholder="كل المدرسين"
//   isFilter
// />
// ════════════════════════════════════════════════════════════

export interface SearchableSelectOption {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder: string;
  disabled?: boolean;
  isFilter?: boolean;
  className?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  isFilter = false,
  className = "",
}: SearchableSelectProps) {
  const [inputValue, setInputValue] = useState("");
  const isActive = isFilterActive(value, isFilter);

  return (
    <ComboBox<SearchableSelectOption>
      selectedKey={value || null}
      onSelectionChange={(key: Key | null) => {
        if (key !== null) onChange(String(key));
      }}
      inputValue={inputValue}
      onInputChange={setInputValue}
      items={options}
      isDisabled={disabled}
      aria-label={placeholder}
      allowsEmptyCollection
      defaultFilter={(textValue, filterValue) =>
        textValue.toLocaleLowerCase().includes(filterValue.toLocaleLowerCase())
      }
      className={[STYLES.root, className].filter(Boolean).join(" ")}
      onOpenChange={(open) => {
        if (!open) setInputValue("");
      }}
    >
      <div className={STYLES.inputWrap}>
        <Search size={14} className={STYLES.searchIcon} aria-hidden="true" />
        <Input
          placeholder={placeholder}
          className={[STYLES.input, isActive ? STYLES.inputActive : ""].join(
            " ",
          )}
        />
        <Button className={STYLES.trigger} aria-label="فتح الخيارات">
          {({ isPressed }) => (
            <ChevronDown
              size={16}
              strokeWidth={2}
              className={[
                STYLES.chevron,
                isActive ? STYLES.chevronActive : "",
                isPressed ? "rotate-180" : "",
              ].join(" ")}
            />
          )}
        </Button>
      </div>
      <Popover className={STYLES.popover} placement="bottom end">
        <ListBox<SearchableSelectOption>
          items={options}
          className={STYLES.list}
          renderEmptyState={() => (
            <div className={STYLES.empty}>لا توجد خيارات مطابقة</div>
          )}
        >
          {(option) => (
            <ListBoxItem
              id={option.value}
              textValue={option.label}
              className={STYLES.item}
            >
              {({ isSelected }) => (
                <>
                  <span>{option.label}</span>
                  {isSelected && <Check size={16} strokeWidth={2.5} />}
                </>
              )}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}
