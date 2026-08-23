import { CircleHelp } from "lucide-react";
import {
  Button as AriaButton,
  Dialog,
  DialogTrigger,
  Popover,
} from "react-aria-components";

interface ParameterInfoProps {
  label: string;
  explanation: string;
  lowerEffect: string;
  higherEffect: string;
}

export function ParameterInfo({
  label,
  explanation,
  lowerEffect,
  higherEffect,
}: ParameterInfoProps) {
  return (
    <DialogTrigger>
      <AriaButton
        aria-label={`شرح ${label}`}
        className="group relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-400 outline-none transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500/30"
      >
        <CircleHelp size={16} aria-hidden="true" />
      </AriaButton>
      <Popover
        placement="top"
        offset={8}
        className="z-50 w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-neutral-200 bg-white p-4 text-start shadow-xl outline-none"
      >
        <Dialog className="flex flex-col gap-3 outline-none">
          <h3 className="text-sm font-bold text-neutral-900">{label}</h3>
          <p className="text-xs leading-relaxed text-neutral-600">{explanation}</p>
          <div className="grid gap-2 border-t border-neutral-100 pt-3 text-xs leading-relaxed">
            <p className="text-red-700">
              <span className="font-bold">عند التخفيض:</span> {lowerEffect}
            </p>
            <p className="text-emerald-700">
              <span className="font-bold">عند الرفع:</span> {higherEffect}
            </p>
          </div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
