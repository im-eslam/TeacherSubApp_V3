import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save, SlidersHorizontal } from "lucide-react";
import { Button } from "../components/controls/Button";
import { NumberField, type NumericFieldValue } from "../components/controls/NumberField";
import {
  EntityErrorBanner,
  EntityPageHeaderPlain,
} from "../components/layout/EntityPageLayout";
import { ModalErrorBanner } from "../components/modals/ModalParts";
import { getErrorMessage } from "../lib/apiErrors";
import { useSettingsPage } from "../features/settings/hooks";
import {
  SETTINGS_LIMITS,
  THRESHOLD_FIELDS,
  WEIGHT_FIELDS,
} from "../features/settings/types";
import type {
  AlgorithmSettingsDto,
  SettingsField,
  ThresholdField,
  WeightField,
} from "../features/settings/types";

type EditableSettings = {
  [K in keyof AlgorithmSettingsDto]: AlgorithmSettingsDto[K] | "";
};

const WEIGHT_META: Record<WeightField, { label: string; helper: string }> = {
  subjectMatchWeight: {
    label: "تطابق المادة",
    helper: "يرفع أولوية المعلمين الذين يدرّسون المادة نفسها.",
  },
  weeklyLoadWeight: {
    label: "العبء الأسبوعي",
    helper: "يفضل المعلمين ذوي العبء الأسبوعي الأقل.",
  },
  dailyLoadWeight: {
    label: "العبء اليومي",
    helper: "يفضل المعلمين الذين لديهم حصص أقل خلال اليوم.",
  },
  standbyWeight: {
    label: "المناوبة",
    helper: "يرفع أولوية المعلمين الموجودين في المناوبة.",
  },
  subbedYesterdayWeight: {
    label: "التغطية في اليوم السابق",
    helper: "يساعد على موازنة توزيع التغطيات بين المعلمين.",
  },
  consecutiveClassWeight: {
    label: "الحصص المتتالية",
    helper: "يزيد أثر تجنب تكليف المعلم بحصص متتالية.",
  },
  earlyLeaveWeight: {
    label: "الخروج المبكر",
    helper: "يراعي حالة الخروج المبكر عند ترشيح البديل.",
  },
};

const THRESHOLD_META: Record<ThresholdField, { label: string; helper: string }> = {
  overtimeThreshold: {
    label: "حد العمل الإضافي",
    helper: "عدد الحصص الأسبوعية الذي يبدأ بعده احتساب العمل الإضافي.",
  },
  lowLoadThreshold: {
    label: "حد العبء المنخفض",
    helper: "الحد الذي يعتبر عنده العبء الأسبوعي منخفضاً.",
  },
  dailyLoadThreshold: {
    label: "حد العبء اليومي",
    helper: "الحد الأعلى للحصص اليومية عند تقييم الحمل.",
  },
  restPeriodBreak: {
    label: "فاصل الراحة",
    helper: "عدد الفترات المطلوبة منذ آخر حصة قبل الترشيح.",
  },
};

function toEditableSettings(settings: AlgorithmSettingsDto): EditableSettings {
  return { ...settings };
}

function parseFieldValue(rawValue: string): NumericFieldValue {
  if (rawValue === "") return "";
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : "";
}

function isFieldValid(field: SettingsField, value: number | ""): boolean {
  if (value === "") return false;
  const limits = SETTINGS_LIMITS[field];
  return (
    Number.isFinite(value) &&
    value >= limits.min &&
    value <= limits.max &&
    (limits.step === "0.01" || Number.isInteger(value))
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3 border-b border-neutral-100 pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <SlidersHorizontal size={19} />
        </span>
        <div>
          <h2 className="text-base font-bold text-neutral-900">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function AlgorithmSettingsForm({
  initialSettings,
  isSaving,
  saveError,
  onSave,
  onResetSaveError,
}: {
  initialSettings: AlgorithmSettingsDto;
  isSaving: boolean;
  saveError: unknown;
  onSave: (settings: AlgorithmSettingsDto) => Promise<void>;
  onResetSaveError: () => void;
}) {
  const [form, setForm] = useState<EditableSettings>(() =>
    toEditableSettings(initialSettings),
  );

  const totalWeight = useMemo(
    () =>
      WEIGHT_FIELDS.reduce(
        (total, field) => total + (typeof form[field] === "number" ? form[field] : 0),
        0,
      ),
    [form],
  );
  const areAllFieldsValid = useMemo(
    () =>
      [...WEIGHT_FIELDS, ...THRESHOLD_FIELDS].every((field) =>
        isFieldValid(field, form[field]),
      ),
    [form],
  );
  const isWeightTotalValid = Math.abs(totalWeight - 100) <= 0.1;
  const canSave = areAllFieldsValid && isWeightTotalValid && !isSaving;

  const updateField = (field: SettingsField, rawValue: string) => {
    onResetSaveError();
    setForm((current) => ({
      ...current,
      [field]: parseFieldValue(rawValue),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) return;
    try {
      await onSave(form as AlgorithmSettingsDto);
    } catch {
      // The page-level view model retains the mutation error for the inline banner.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <fieldset disabled={isSaving} className="contents">
        <SettingsSection
          title="أوزان المعايير"
          description="توزيع تأثيرات خوارزمية الترشيح. يجب أن يساوي مجموع الأوزان 100."
        >
          <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
            {WEIGHT_FIELDS.map((field) => {
              const meta = WEIGHT_META[field];
              const limits = SETTINGS_LIMITS[field];
              return (
                <NumberField
                  key={field}
                  label={meta.label}
                  value={form[field]}
                  onChange={(value) => updateField(field, value)}
                  step={limits.step}
                  min={limits.min}
                  max={limits.max}
                  helperText={meta.helper}
                />
              );
            })}
          </div>

          <div
            className={`mt-6 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${isWeightTotalValid ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}
            role="status"
            aria-live="polite"
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              {isWeightTotalValid ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              مجموع الأوزان
            </span>
            <span className="text-base font-bold tabular-nums">
              {totalWeight.toFixed(2)} / 100
            </span>
          </div>
          {!isWeightTotalValid && (
            <p className="mt-2 text-xs text-amber-700">
              عدّل الأوزان حتى يصبح المجموع 100 مع سماحية ±0.1 قبل الحفظ.
            </p>
          )}
        </SettingsSection>

        <SettingsSection
          title="حدود وعتبات"
          description="قيم مستقلة تضبط متى تعتبر الحصة أو المعلم مناسباً للترشيح."
        >
          <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
            {THRESHOLD_FIELDS.map((field) => {
              const meta = THRESHOLD_META[field];
              const limits = SETTINGS_LIMITS[field];
              return (
                <NumberField
                  key={field}
                  label={meta.label}
                  value={form[field]}
                  onChange={(value) => updateField(field, value)}
                  step={limits.step}
                  min={limits.min}
                  max={limits.max}
                  helperText={`${meta.helper} النطاق المسموح: ${limits.min}–${limits.max}.`}
                />
              );
            })}
          </div>
        </SettingsSection>
      </fieldset>

      {saveError != null && <ModalErrorBanner message={getErrorMessage(saveError)} />}

      <div className="flex flex-col gap-3 rounded-3xl border border-neutral-200/70 bg-neutral-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-xs leading-relaxed text-neutral-500">
          تُعاد قراءة القيم من الخادم بعد الحفظ للتأكد من تطبيق الإعدادات الفعلية.
        </p>
        <Button
          type="submit"
          variant="primary"
          isDisabled={!canSave}
          className="shrink-0"
        >
          {isSaving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
          {isSaving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const {
    settings,
    isLoading,
    isError,
    error,
    retry,
    isSaving,
    saveError,
    save,
    resetSaveError,
  } = useSettingsPage();

  return (
    <div dir="rtl" className="flex min-h-full flex-col gap-6 p-6">
      <EntityPageHeaderPlain
        title="الإعدادات"
        subtitle="خوارزمية الاستبدال"
        description="اضبط أوزان المعايير والعتبات التي يستخدمها النظام لترشيح أفضل بديل للحصص الغائبة."
      />

      {isError && <EntityErrorBanner error={error} onRetry={retry} isRetrying={isLoading} />}

      {isLoading && !settings && (
        <div className="grid gap-5" aria-label="جارٍ تحميل إعدادات خوارزمية الاستبدال">
          {[1, 2].map((skeleton) => (
            <div key={skeleton} className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
              <div className="mb-6 h-5 w-44 animate-pulse rounded-full bg-neutral-200" />
              <div className="grid gap-5 md:grid-cols-2">
                {[1, 2, 3, 4].map((field) => (
                  <div key={field} className="flex flex-col gap-2">
                    <div className="h-3 w-24 animate-pulse rounded-full bg-neutral-200" />
                    <div className="h-11 animate-pulse rounded-full bg-neutral-100" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && !settings && (
        <div className="rounded-3xl border border-neutral-200 bg-white px-5 py-12 text-center text-sm text-neutral-500 shadow-sm">
          لا توجد إعدادات متاحة حالياً.
        </div>
      )}

      {settings && (
        <AlgorithmSettingsForm
          key={JSON.stringify(settings)}
          initialSettings={settings}
          isSaving={isSaving}
          saveError={saveError}
          onSave={save}
          onResetSaveError={resetSaveError}
        />
      )}
    </div>
  );
}
