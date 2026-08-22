import { useMemo, useState } from "react";
import { ChevronDown, Loader2, ShieldAlert, Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../../components/controls/Button";
import { ModalShell } from "../../../components/modals/ModalShell";
import { getErrorMessage } from "../../../lib/apiErrors";
import { useCreateSubstitution, useRecommendations } from "../hooks";
import { TIER_META, tierStyles } from "./tierMeta";
import type { CandidateTier, SlotContext, SubstituteCandidateDto } from "../types";

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  absenceId: number;
  slot: SlotContext;
}

function CandidateCard({
  candidate,
  isDisabled,
  onSelect,
}: {
  candidate: SubstituteCandidateDto;
  isDisabled: boolean;
  onSelect: (candidate: SubstituteCandidateDto) => void;
}) {
  const meta = TIER_META[candidate.tier];
  const styles = tierStyles(candidate.tier);

  return (
    <Button
      type="button"
      variant="secondary"
      onPress={() => onSelect(candidate)}
      isDisabled={isDisabled}
      className={`group flex min-h-0 w-full items-center justify-between rounded-xl border px-3 py-2.5 text-start shadow-sm transition-all ${styles.card}`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ${styles.avatar}`}
        >
          {candidate.teacherName.trim().slice(0, 1)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-base font-bold leading-5 text-neutral-900"
>
            {candidate.teacherName}
          </span>
          <span className="mt-0.5 block truncate text-sm leading-5 text-neutral-500"
>
            {candidate.subjectName ?? "بلا مادة"}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${styles.badge}`}>
          {meta.label}
        </span>
        <span className="text-xs font-semibold text-neutral-500">
          {candidate.totalScore.toFixed(2)} نقطة
        </span>
      </span>
    </Button>
  );
}

function TierSection({
  title,
  hint,
  candidates,
  isDisabled,
  onSelect,
  defaultOpen,
}: {
  title: string;
  hint?: string;
  candidates: SubstituteCandidateDto[];
  isDisabled: boolean;
  onSelect: (candidate: SubstituteCandidateDto) => void;
  defaultOpen: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  if (candidates.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-2 rounded-xl px-1 py-1 text-start outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
      >
        <span className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-500">{title}</span>
          {hint && <span className="text-[11px] font-normal text-neutral-400">· {hint}</span>}
        </span>
        <ChevronDown
          size={16}
          className={`text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div className="flex flex-col gap-3">
          {candidates.map((candidate) => (
            <CandidateCard
              key={`${candidate.teacherId}-${candidate.tier}`}
              candidate={candidate}
              isDisabled={isDisabled}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function RecommendationModal({
  isOpen,
  onClose,
  absenceId,
  slot,
}: RecommendationModalProps) {
  const query = useMemo(
    () => ({
      absentTeacherId: slot.absentTeacherId,
      serviceDate: slot.serviceDate,
      periodNumber: slot.periodNumber,
    }),
    [slot.absentTeacherId, slot.periodNumber, slot.serviceDate],
  );
  const recommendations = useRecommendations(query, isOpen);
  const mutation = useCreateSubstitution();
  const candidates = useMemo(
    () => recommendations.data ?? [],
    [recommendations.data],
  );

  const byGroup = useMemo(() => {
    const groups: Record<CandidateTier, SubstituteCandidateDto[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    };
    for (const candidate of candidates) {
      groups[candidate.tier].push(candidate);
    }
    return groups;
  }, [candidates]);

  const hasAny = candidates.length > 0;
  const hasLastResort = byGroup[4].length > 0 || byGroup[5].length > 0;

  const handleSelect = async (candidate: SubstituteCandidateDto) => {
    try {
      await mutation.mutateAsync({
        absenceId,
        weeklyScheduleId: slot.weeklyScheduleId,
        substituteTeacherId: candidate.teacherId,
        serviceDate: slot.serviceDate,
        isAlgorithmMatch: true,
        optimisticName: candidate.teacherName,
        optimisticSubject: candidate.subjectName ?? "",
      });
      toast.success("تم تعيين البديل بنجاح");
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      isBusy={mutation.isPending}
      size="xl"
    >
      <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Sparkles size={16} />
            </span>
            <h2 className="text-lg font-bold text-neutral-900">اختيار البديل</h2>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            الفترة {slot.periodNumber} · نرتب لك أفضل المعلمين المتاحين تلقائياً.
          </p>
        </div>
        <Button variant="quiet" aria-label="إغلاق" onPress={onClose} isDisabled={mutation.isPending}>
          <X size={18} />
        </Button>
      </div>

      <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto px-6 py-6">
        {recommendations.isLoading && (
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-neutral-50 py-12 text-sm text-neutral-500">
            <Loader2 size={18} className="animate-spin" /> جارٍ تحليل أفضل البدائل...
          </div>
        )}

        {recommendations.isError && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700" role="alert">
            تعذر تحميل التوصيات. أغلق النافذة ثم حاول مرة أخرى.
          </div>
        )}

        {!recommendations.isLoading && !recommendations.isError && !hasAny && (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
            لا يوجد معلمون متاحون لهذه الحصة حالياً.
          </div>
        )}

        <TierSection
          title="أفضل التطابقات"
          hint="نفس المادة ومتفرغ الآن"
          candidates={byGroup[1]}
          isDisabled={mutation.isPending}
          onSelect={handleSelect}
          defaultOpen
        />

        <TierSection
          title="متاح بأجر إضافي"
          hint="قد يتجاوز النصاب المعتاد"
          candidates={byGroup[2]}
          isDisabled={mutation.isPending}
          onSelect={handleSelect}
          defaultOpen
        />

        <TierSection
          title="معلم مساعد"
          hint="متاح ضمن دور الدعم"
          candidates={byGroup[3]}
          isDisabled={mutation.isPending}
          onSelect={handleSelect}
          defaultOpen
        />

        {hasLastResort && (
          <details className="group rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-neutral-600 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30">
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldAlert size={15} className="text-red-500" />
                  عرض الخيارات غير المحبذة
                </span>
                <span className="text-xs font-normal text-neutral-400">
                  {byGroup[4].length + byGroup[5].length} خيارات
                </span>
              </span>
            </summary>
            <div className="mt-4 flex flex-col gap-5 border-t border-neutral-200 pt-4">
              <TierSection
                title="في اجتماع"
                candidates={byGroup[4]}
                isDisabled={mutation.isPending}
                onSelect={handleSelect}
                defaultOpen={false}
              />
              <TierSection
                title="فريق الإشراف"
                candidates={byGroup[5]}
                isDisabled={mutation.isPending}
                onSelect={handleSelect}
                defaultOpen={false}
              />
            </div>
          </details>
        )}
      </div>
    </ModalShell>
  );
}
