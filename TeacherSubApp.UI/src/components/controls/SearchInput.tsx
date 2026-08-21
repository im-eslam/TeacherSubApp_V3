import { memo } from "react";
import {
  SearchField,
  Input,
  Button,
  composeRenderProps,
  type SearchFieldProps,
} from "react-aria-components";
import { Search, X } from "lucide-react";

const STYLES = {
  field: "relative flex-1 min-w-[280px] max-w-sm",

  input:
    "w-full ps-11 pe-11 py-2.5 min-h-[44px] text-sm text-neutral-900 bg-white border border-neutral-200/80 rounded-full placeholder:text-neutral-400 outline-none transition-all hover:border-blue-300 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 [&::-webkit-search-cancel-button]:hidden",

  searchIcon:
    "absolute top-1/2 -translate-y-1/2 start-4 text-neutral-400 pointer-events-none",

  clearButton:
    "absolute top-1/2 -translate-y-1/2 end-3 flex items-center justify-center w-6 h-6 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 group-empty:invisible",
};

// ════════════════════════════════════════════════════════════
// SearchInput
// ════════════════════════════════════════════════════════════
// Usage (inside a feature page toolbar):
//
//   <SearchInput
//     value={query}
//     onChange={setQuery}
//     placeholder="بحث عن مادة..."
//     isDisabled={isDisabled}
//   />
// ════════════════════════════════════════════════════════════

interface SearchInputProps extends Omit<
  SearchFieldProps,
  "children" | "value" | "onChange"
> {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isDisabled?: boolean;
}

export const SearchInput = memo(function SearchInput({
  value,
  onChange,
  placeholder,
  isDisabled = false,
  ...rest
}: SearchInputProps) {
  return (
    <SearchField
      {...rest}
      value={value}
      onChange={onChange}
      isDisabled={isDisabled}
      aria-label={placeholder}
      className={composeRenderProps(rest.className, (className) =>
        [STYLES.field, className].filter(Boolean).join(" "),
      )}
    >
      <Search
        size={18}
        strokeWidth={2}
        className={STYLES.searchIcon}
        aria-hidden="true"
      />
      <Input placeholder={placeholder} className={STYLES.input} />
      <Button className={STYLES.clearButton}>
        <X size={14} strokeWidth={2.5} />
      </Button>
    </SearchField>
  );
});

SearchInput.displayName = "SearchInput";
