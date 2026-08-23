import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DatePicker as AriaDatePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  I18nProvider,
  Label,
  Popover,
  Button,
} from "react-aria-components";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { parseDate, type DateValue } from "@internationalized/date";

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  labelClassName?: string;
}

export function DatePicker({
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  labelClassName = "text-xs font-medium text-neutral-500",
}: DatePickerProps) {
  const dateValue = value ? parseDate(value) : null;

  return (
    <I18nProvider locale="ar-EG">
      <AriaDatePicker
        value={dateValue}
        onChange={(nextValue: DateValue | null) => {
          if (nextValue) onChange(nextValue.toString());
        }}
        isDisabled={disabled}
        isRequired={required}
        className="flex flex-col gap-1.5"
      >
        {label && <Label className={labelClassName}>{label}</Label>}
        <Group className="flex min-h-[44px] items-center rounded-full border border-neutral-200/80 bg-white px-4 text-sm text-neutral-900 outline-none transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30 data-[disabled]:opacity-50">
          <DateInput className="flex min-w-[200px] flex-1 items-center outline-none">
            {(segment) => (
              <DateSegment
                segment={segment}
                className="rounded px-0.5 text-sm outline-none focus:bg-blue-100 focus:text-blue-800"
              />
            )}
          </DateInput>
          <Button
            aria-label="فتح التقويم"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 outline-none transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-blue-500/30"
          >
            <CalendarDays size={17} aria-hidden="true" />
          </Button>
        </Group>
        <Popover className="z-50 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl outline-none entering:animate-in entering:fade-in entering:zoom-in-95 entering:duration-150">
          <Dialog className="outline-none">
            <Calendar className="flex w-[280px] flex-col gap-3">
              <header className="flex items-center justify-between">
                <Button
                  slot="previous"
                  aria-label="الشهر السابق"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-blue-500/30"
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </Button>
                <Heading className="text-sm font-bold text-neutral-900" />
                <Button
                  slot="next"
                  aria-label="الشهر التالي"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-blue-500/30"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </Button>
              </header>
              <CalendarGrid className="w-full border-separate border-spacing-1">
                <CalendarGridHeader>
                  {(day) => (
                    <CalendarHeaderCell className="pb-1 text-center text-[10px] font-semibold text-neutral-400">
                      {day}
                    </CalendarHeaderCell>
                  )}
                </CalendarGridHeader>
                <CalendarGridBody>
                  {(date) => (
                    <CalendarCell
                      date={date}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs text-neutral-700 outline-none hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500/30 data-[selected]:bg-blue-600 data-[selected]:font-bold data-[selected]:text-white data-[today]:ring-1 data-[today]:ring-blue-300"
                    />
                  )}
                </CalendarGridBody>
              </CalendarGrid>
            </Calendar>
          </Dialog>
        </Popover>
      </AriaDatePicker>
    </I18nProvider>
  );
}
