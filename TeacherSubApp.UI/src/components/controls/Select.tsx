import {
  Select as AriaSelect,
  Button,
  SelectValue,
  Popover,
  ListBox,
  ListBoxItem,
  composeRenderProps,
  type SelectProps,
  type Key,
} from "react-aria-components";
import { ChevronDown } from "lucide-react";
import { isFilterActive } from "../../lib/useFilterState";

const STYLES = {
  root: "flex flex-col",

  triggerBase: [
    "flex items-center justify-between w-full px-4 py-2.5 min-h-[44px]",
    "border rounded-full text-sm outline-none cursor-default",
    "transition-colors duration-150",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),

  triggerIdle: [
    "bg-white border-neutral-200/80 text-neutral-900",
    "hover:border-blue-300",
    "focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500",
    "data-[placeholder]:text-neutral-400",
  ].join(" "),

  triggerActive: [
    "bg-blue-50 border-blue-200 text-blue-700",
    "hover:bg-blue-100",
    "focus-visible:ring-2 focus-visible:ring-blue-500/30",
  ].join(" "),

  value: "flex-1 text-start truncate",
  chevron: "shrink-0 ms-2",
  chevronIdle: "text-neutral-400",
  chevronActive: "text-blue-500",

  popover: [
    "w-[--trigger-width] bg-white border border-neutral-200/80 rounded-xl",
    "overflow-hidden p-1",
    "entering:animate-in entering:fade-in entering:zoom-in-95 entering:duration-150",
    "exiting:animate-out exiting:fade-out exiting:zoom-out-95 exiting:duration-100",
  ].join(" "),

  listbox: "max-h-64 overflow-auto outline-none flex flex-col gap-0.5",

  item: [
    "flex items-center px-3 py-2.5 text-sm text-neutral-700 rounded-lg cursor-default select-none outline-none",
    "data-[focused]:bg-blue-50 data-[focused]:text-blue-700",
    "data-[selected]:font-medium data-[selected]:text-blue-700",
    "transition-colors duration-150",
  ].join(" "),
};

// ════════════════════════════════════════════════════════════
// Select
// ════════════════════════════════════════════════════════════
// Usage (inside a feature page toolbar):
//
//   <Select
//     value={roleFilter}
//     onChange={setRoleFilter}
//     options={[
//       { value: "all",        label: "كل الأدوار" },
//       { value: "supervisor", label: "مشرفون فقط" },
//       { value: "teacher",    label: "معلمون فقط" },
//     ]}
//     placeholder="كل الأدوار"
//     disabled={isDisabled}
//   />
// ════════════════════════════════════════════════════════════

export interface SelectOption {
  value: string;
  label: string;
}

type StrippedSelectProps = Omit<
  SelectProps<SelectOption>,
  | "children"
  | "items"
  | "selectedKey"
  | "defaultSelectedKey"
  | "onSelectionChange"
  | "onChange"
>;

export interface AppSelectProps extends StrippedSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  isFilter?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  isFilter = false,
  ...rest
}: AppSelectProps) {
  const isActive = isFilterActive(value, isFilter);

  return (
    <AriaSelect<SelectOption>
      {...rest}
      selectedKey={value}
      onSelectionChange={(key: Key | null) =>
        onChange(key == null ? "" : String(key))
      }
      isDisabled={disabled}
      aria-label={rest["aria-label"] ?? placeholder}
      className={composeRenderProps(rest.className, (className) =>
        [STYLES.root, className].filter(Boolean).join(" "),
      )}
    >
      {/* Trigger button */}
      <Button
        className={[
          STYLES.triggerBase,
          isActive ? STYLES.triggerActive : STYLES.triggerIdle,
        ].join(" ")}
      >
        <SelectValue className={STYLES.value}>
          {({ selectedText }) =>
            selectedText ? (
              <span>{selectedText}</span>
            ) : (
              <span className="text-neutral-400">{placeholder}</span>
            )
          }
        </SelectValue>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={isActive ? STYLES.chevronActive : STYLES.chevronIdle}
        />
      </Button>

      {/* Popover + ListBox */}
      <Popover className={STYLES.popover}>
        <ListBox<SelectOption> items={options} className={STYLES.listbox}>
          {(option) => (
            <ListBoxItem
              key={option.value}
              id={option.value}
              textValue={option.label}
              className={STYLES.item}
            >
              {option.label}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}
