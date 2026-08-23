import { useMemo, useState } from "react";
import { ChevronDown, Loader2, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../../components/controls/Button";
import {
  ModalBody,
  ModalErrorBanner,
  ModalHeader,
} from "../../../components/modals/ModalParts";
import { ModalShell } from "../../../components/modals/ModalShell";
import { getErrorMessage } from "../../../lib/apiErrors";
import {
  useCreateSubstitution,
  useRecommendations,
  useUnassignSubstitution,
  useUpdateSubstitution,
} from "../hooks";
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
  isCurrent,
  onSelect,
}: {
  candidate: SubstituteCandidateDto;
  isDisabled: boolean;
  isCurrent: boolean;
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
      aria-label={`اختيار ${candidate.teacherName}`}
      className={`group flex min-h-0 w-full items-center justify-between rounded-xl border px-3 py-2.5 text-start shadow-sm transition-all ${styles.card}`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ${styles.avatar}`}
        >
          {candidate.teacherName.trim().slice(0, 1)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold leading-5 text-neutral-900">
            {candidate.teacherName}
          </span>
          <span className="mt-0.5 block truncate text-sm leading-5 text-neutral-600">
            {candidate.subjectName ?? "بلا مادة"}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 items-end gap-2">
        {isCurrent && (
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
            الحالي
          </span>
        )}
        <span className="flex flex-col items-end gap-1">
          <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${styles.badge}`}>
            {meta.label}
          </span>
          <span className="text-[11px] font-semibold text-neutral-600">
            {candidate.totalScore.toFixed(2)} نقطة
          </span>
        </span>
      </span>
    </Button>
  );
}

function TierSection({
  tier,
  candidates,
  isDisabled,
  currentTeacherId,
  onSelect,
  defaultOpen,
}: {
  tier: CandidateTier;
  candidates: SubstituteCandidateDto[];
  isDisabled: boolean;
  currentTeacherId?: number;
  onSelect: (candidate: SubstituteCandidateDto) => void;
  defaultOpen: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const meta = TIER_META[tier];
  if (candidates.length === 0) return null;

  return (
    <section className="rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tier === 1 ? "bg-emerald-500" : tier === 2 ? "bg-amber-500" : tier === 3 ? "bg-blue-500" : tier === 4 ? "bg-orange-500" : "bg-neutral-500"}`} />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-neutral-900">{meta.label}</span>
            <span className="mt-0.5 block truncate text-xs text-neutral-500">{meta.sublabel}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-neutral-400">
          {candidates.length} خيارات
          <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </span>
      </button>
      {isOpen && (
        <div className="mt-2 flex flex-col gap-2 border-t border-neutral-100 pt-2">
          {candidates.map((candidate) => (
            <CandidateCard
              key={`${candidate.teacherId}-${candidate.tier}`}
              candidate={candidate}
              isDisabled={isDisabled}
              isCurrent={candidate.teacherId === currentTeacherId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function RecommendationModal({
  isOpen,
  onClose,
  absenceId,
  slot,
}: RecommendationModalProps) {
  const [error, setError] = useState<unknown>(null);
  const [confirmingUnassign, setConfirmingUnassign] = useState(false);
  const query = useMemo(
    () => ({
      absentTeacherId: slot.absentTeacherId,
      serviceDate: slot.serviceDate,
      periodNumber: slot.periodNumber,
    }),
    [slot.absentTeacherId, slot.periodNumber, slot.serviceDate],
  );
  const recommendations = useRecommendations(query, isOpen);
  const createMutation = useCreateSubstitution();
  const updateMutation = useUpdateSubstitution();
  const unassignMutation = useUnassignSubstitution();
  const isBusy = createMutation.isPending || updateMutation.isPending || unassignMutation.isPending;
  const candidates = useMemo(() => recommendations.data ?? [], [recommendations.data]);
  const byTier = useMemo(() => {
    const groups: Record<CandidateTier, SubstituteCandidateDto[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    for (const candidate of candidates) groups[candidate.tier].push(candidate);
    return groups;
  }, [candidates]);
  const existingSubstitution = slot.substitution;
  const hasLastResort = byTier[4].length > 0 || byTier[5].length > 0;

  const handleSelect = async (candidate: SubstituteCandidateDto) => {
    setError(null);
    try {
      const dto = {
        absenceId,
        weeklyScheduleId: slot.weeklyScheduleId,
        substituteTeacherId: candidate.teacherId,
        serviceDate: slot.serviceDate,
        isAlgorithmMatch: true,
        optimisticName: candidate.teacherName,
        optimisticSubject: candidate.subjectName ?? "",
      };
      if (existingSubstitution) {
        await updateMutation.mutateAsync({ id: existingSubstitution.id, dto });
      } else {
        await createMutation.mutateAsync(dto);
      }
      toast.success(existingSubstitution ? "تم تعديل البديل بنجاح" : "تم تعيين البديل بنجاح");
      onClose();
    } catch (submissionError) {
      setError(submissionError);
    }
  };

  const handleUnassign = async () => {
    if (!existingSubstitution) return;
    setError(null);
    try {
      await unassignMutation.mutateAsync({
        id: existingSubstitution.id,
        serviceDate: slot.serviceDate,
      });
      toast.success("تم إلغاء تعيين البديل");
      onClose();
    } catch (unassignError) {
      setError(unassignError);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      isBusy={isBusy}
      size="xl"
    >
      <ModalHeader
        title={existingSubstitution ? "تعديل البديل" : "اختيار البديل"}
        isBusy={isBusy}
        onClose={onClose}
      />
      <ModalBody allowBodyOverflow>
        <div className="flex items-start justify-between gap-4 rounded-2xl bg-neutral-50 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-neutral-900">الحصة {slot.periodNumber}</p>
            <p className="mt-1 text-xs text-neutral-500">تظهر الفئات مرتبة من الأنسب إلى الحل الأخير.</p>
          </div>
          {existingSubstitution && (
            <div className="text-end">
              <p className="text-xs font-semibold text-neutral-500">البديل الحالي</p>
              <p className="mt-1 text-sm font-bold text-emerald-700">{existingSubstitution.substituteTeacherNameAtTimeOfService}</p>
            </div>
          )}
        </div>

        {error != null && <ModalErrorBanner message={getErrorMessage(error)} />}

        {existingSubstitution && (
          <div className="rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3">
            {!confirmingUnassign ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-red-700">هل تريد إلغاء تعيين البديل وترك الحصة دون تغطية؟</p>
                <Button
                  type="button"
                  variant="quiet"
                  onPress={() => setConfirmingUnassign(true)}
                  isDisabled={isBusy}
                  className="shrink-0 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  إلغاء التعيين
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-xs font-semibold text-red-700"><ShieldAlert size={15} /> تأكيد إلغاء التعيين؟</p>
                <span className="flex shrink-0 items-center gap-2">
                  <Button type="button" variant="destructive" onPress={handleUnassign} isDisabled={isBusy} className="px-3 py-2 text-xs">نعم، إلغاء</Button>
                  <Button type="button" variant="quiet" onPress={() => setConfirmingUnassign(false)} isDisabled={isBusy} className="px-3 py-2 text-xs">تراجع</Button>
                </span>
              </div>
            )}
          </div>
        )}

        {recommendations.isLoading && (
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-neutral-50 py-10 text-sm text-neutral-500">
            <Loader2 size={18} className="animate-spin" /> جارٍ تحليل أفضل البدائل...
          </div>
        )}
        {recommendations.isError && (
          <ModalErrorBanner message={getErrorMessage(recommendations.error)} />
        )}
        {!recommendations.isLoading && !recommendations.isError && candidates.length === 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">لا يوجد معلمون متاحون لهذه الحصة حالياً.</div>
        )}

        <div className="flex flex-col gap-3">
          <TierSection tier={1} candidates={byTier[1]} isDisabled={isBusy} currentTeacherId={existingSubstitution?.substituteTeacherId} onSelect={handleSelect} defaultOpen />
          <TierSection tier={2} candidates={byTier[2]} isDisabled={isBusy} currentTeacherId={existingSubstitution?.substituteTeacherId} onSelect={handleSelect} defaultOpen />
          <TierSection tier={3} candidates={byTier[3]} isDisabled={isBusy} currentTeacherId={existingSubstitution?.substituteTeacherId} onSelect={handleSelect} defaultOpen />
        </div>

        {hasLastResort && (
          <details className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-neutral-600 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30">
              <span className="flex items-center gap-2"><ShieldAlert size={15} className="text-red-500" /> عرض الخيارات غير المحبذة</span>
              <span className="text-xs font-normal text-neutral-400">{byTier[4].length + byTier[5].length} خيارات</span>
            </summary>
            <div className="mt-3 flex flex-col gap-3 border-t border-neutral-200 pt-3">
              <TierSection tier={4} candidates={byTier[4]} isDisabled={isBusy} currentTeacherId={existingSubstitution?.substituteTeacherId} onSelect={handleSelect} defaultOpen={false} />
              <TierSection tier={5} candidates={byTier[5]} isDisabled={isBusy} currentTeacherId={existingSubstitution?.substituteTeacherId} onSelect={handleSelect} defaultOpen={false} />
            </div>
          </details>
        )}
      </ModalBody>
    </ModalShell>
  );
}
