import { useState, useRef, useMemo, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { useOnClickOutside } from "../../lib/useOnClickOutside";
import { isFilterActive } from "../../lib/useFilterState";

const STYLES = {
  container: "relative w-full flex flex-col",

  triggerBase: [
    "flex items-center justify-between w-full px-4 py-2.5 min-h-[44px]",
    "border rounded-full text-sm outline-none",
    "transition-colors duration-150",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),

  triggerIdle: [
    "bg-white border-neutral-200/80 text-neutral-900",
    "hover:border-blue-300",
    "focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500",
  ].join(" "),

  triggerActive: [
    "bg-blue-50 border-blue-200 text-blue-700",
    "hover:bg-blue-100",
    "focus:ring-2 focus:ring-blue-500/30",
  ].join(" "),

  value: "flex-1 text-start truncate",
  placeholder: "text-neutral-400",

  chevron: "shrink-0 ms-2 transition-transform duration-200",
  chevronIdle: "text-neutral-400",
  chevronActive: "text-blue-500",

  dropdown: [
    "absolute top-full z-50 w-full mt-2 bg-white border border-neutral-200/80 rounded-xl",
    "overflow-hidden p-1 shadow-lg",
    "animate-in fade-in zoom-in-95 duration-150",
  ].join(" "),

  searchWrapper: "p-1.5 border-b border-neutral-100",
  searchInputWrapper: "relative flex items-center",
  searchIcon: "absolute start-2.5 text-neutral-400 pointer-events-none",
  searchInput: [
    "w-full py-2 ps-8 pe-3 text-sm text-neutral-900 bg-neutral-50/50 border border-transparent rounded-lg",
    "focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-500/20 transition-all",
  ].join(" "),

  list: "max-h-64 overflow-y-auto flex flex-col gap-0.5 mt-1 outline-none",

  item: [
    "flex items-center justify-between w-full px-3 py-2.5 text-sm text-neutral-700 rounded-lg cursor-pointer",
    "transition-colors duration-150 outline-none",
  ].join(" "),

  itemFocused: "bg-blue-50 text-blue-700",
  itemSelected: "font-medium text-blue-700",
  itemIdle: "hover:bg-neutral-100 hover:text-neutral-900",

  empty: "px-3 py-6 text-xs text-center text-neutral-400",
};

// ════════════════════════════════════════════════════════════
// Searchable Select
// ════════════════════════════════════════════════════════════
// Example usage:
//
// const [teacherId, setTeacherId] = useState("");
//
// const teachers = [
//   { value: "1", label: "Ahmed Ali" },
//   { value: "2", label: "Mohamed Hassan" },
//   { value: "3", label: "Omar Mahmoud" },
// ];
//
// <SearchableSelect
//   value={teacherId}
//   onChange={setTeacherId}
//   options={teachers}
//   placeholder="اختر المدرس"
// />
//
// For a filter:
//
// const [teacherFilter, setTeacherFilter] = useState("");
//
// <SearchableSelect
//   value={teacherFilter}
//   onChange={setTeacherFilter}
//   options={teachers}
//   placeholder="كل المدرسين"
//   isFilter
// />
//
// Disable the select:
//
// <SearchableSelect
//   value={teacherId}
//   onChange={setTeacherId}
//   options={teachers}
//   placeholder="اختر المدرس"
//   disabled
// />
// ════════════════════════════════════════════════════════════

interface Option {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
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
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);

  const isActive = isFilterActive(value, isFilter);

  useOnClickOutside(containerRef, () => setIsOpen(false));

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [options, searchQuery]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setSearchQuery("");
        const currentIndex = options.findIndex((opt) => opt.value === value);
        setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
      }, 0);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, value, options]);

  useEffect(() => {
    setTimeout(() => {
      setHighlightedIndex(0);
    }, 0);
  }, [searchQuery]);

  useEffect(() => {
    if (isOpen && optionsListRef.current) {
      const highlightedElement = optionsListRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions.length > 0) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div
      ref={containerRef}
      className={`${STYLES.container} ${className}`}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={[
          STYLES.triggerBase,
          isActive ? STYLES.triggerActive : STYLES.triggerIdle,
        ].join(" ")}
      >
        <span className={STYLES.value}>
          {selectedOption ? (
            <span>{selectedOption.label}</span>
          ) : (
            <span className={STYLES.placeholder}>{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={[
            STYLES.chevron,
            isOpen ? "rotate-180" : "",
            isActive ? STYLES.chevronActive : STYLES.chevronIdle,
          ].join(" ")}
        />
      </button>

      {isOpen && (
        <div className={STYLES.dropdown} dir="rtl">
          <div className={STYLES.searchWrapper}>
            <div className={STYLES.searchInputWrapper}>
              <Search size={14} className={STYLES.searchIcon} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث..."
                className={STYLES.searchInput}
              />
            </div>
          </div>

          <div className={STYLES.list} ref={optionsListRef}>
            {filteredOptions.length === 0 ? (
              <div className={STYLES.empty}>لا توجد خيارات مطابقة</div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={[
                      STYLES.item,
                      isSelected ? STYLES.itemSelected : "",
                      isHighlighted ? STYLES.itemFocused : "",
                      !isSelected && !isHighlighted ? STYLES.itemIdle : "",
                    ].join(" ")}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={16} strokeWidth={2.5} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
