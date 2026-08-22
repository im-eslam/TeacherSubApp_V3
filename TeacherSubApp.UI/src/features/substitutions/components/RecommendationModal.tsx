import { useMemo } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../../components/controls/Button";
import { ModalShell } from "../../../components/modals/ModalShell";
import { getErrorMessage } from "../../../lib/apiErrors";
import { useCreateSubstitution, useRecommendations } from "../hooks";
import type {
  CandidateTier,
  SubstituteCandidateDto,
} from "../types";

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  absenceId: number;
  absentTeacherId: number;
  weeklyScheduleId: number;
  periodNumber: number;
  serviceDate: string;
}

const TIER_META: Record<CandidateTier, { label: string; className: string; badgeClassName: string }> = {
  1: {
    label: "أفضل تطابق",
    className: "border-emerald-200 bg-emerald-50/80 hover:border-emerald-400 hover:bg-emerald-50",
    badgeClassName: "bg-emerald-100 text-emerald-700",
  },
  2: {
    label: "خيار مناسب",
    className: "border-blue-200 bg-blue-50/70 hover:border-blue-400 hover:bg-blue-50",
    badgeClassName: "bg-blue-100 text-blue-700",
  },
  3: {
    label: "خيار مقبول",
    className: "border-amber-200 bg-amber-50/70 hover:border-amber-400 hover:bg-amber-50",
    badgeClassName: "bg-amber-100 text-amber-700",
  },
  4: {
    label: "خيار غير مفضل",
    className: "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-red-200 hover:bg-red-50/70",
    badgeClassName: "bg-neutral-200 text-neutral-600",
  },
  5: {
    label: "حل أخير",
    className: "border-red-100 bg-red-50/50 text-neutral-600 hover:border-red-200 hover:bg-red-50",
    badgeClassName: "bg-red-100 text-red-600",
  },
};

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
  return (
    <Button
      type="button"
      variant="secondary"
      onPress={() => onSelect(candidate)}
      isDisabled={isDisabled}
      className={`group flex min-h-0 w-full items-center justify-between rounded-2xl border px-4 py-4 text-start shadow-sm transition-all ${meta.className}`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-sm font-bold text-neutral-700 shadow-sm">
          {candidate.teacherName.trim().slice(0, 1)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-neutral-900">{candidate.teacherName}</span>
          <span className="mt-1 block truncate text-xs text-neutral-500">{candidate.subjectName ?? "بلا مادة"}</span>
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${meta.badgeClassName}`}>{meta.label}</span>
        <span className="text-xs font-semibold text-neutral-500">{candidate.totalScore.toFixed(2)} نقطة</span>
      </span>
    </Button>
  );
}

export function RecommendationModal({
  isOpen,
  onClose,
  absenceId,
  absentTeacherId,
  weeklyScheduleId,
  periodNumber,
  serviceDate,
}: RecommendationModalProps) {
  const query = useMemo(
    () => ({ absentTeacherId, serviceDate, periodNumber }),
    [absentTeacherId, periodNumber, serviceDate],
  );
  const recommendations = useRecommendations(query, isOpen);
  const mutation = useCreateSubstitution();
  const candidates = recommendations.data ?? [];
  const visibleCandidates = candidates.filter((candidate) => candidate.tier <= 3);
  const unfavorableCandidates = candidates.filter((candidate) => candidate.tier >= 4);

  const handleSelect = async (candidate: SubstituteCandidateDto) => {
    try {
      await mutation.mutateAsync({
        absenceId,
        weeklyScheduleId,
        substituteTeacherId: candidate.teacherId,
        serviceDate,
        isAlgorithmMatch: true,
      });
      toast.success("تم تعيين البديل بنجاح");
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <ModalShell isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isBusy={mutation.isPending} size="xl">
      <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Sparkles size={16} /></span>
            <h2 className="text-lg font-bold text-neutral-900">اختيار البديل</h2>
          </div>
          <p className="mt-2 text-xs text-neutral-500">الفترة {periodNumber} · نرتب لك أفضل المعلمين المتاحين تلقائياً.</p>
        </div>
        <Button variant="quiet" aria-label="إغلاق" onPress={onClose} isDisabled={mutation.isPending}>
          <X size={18} />
        </Button>
      </div>

      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto px-6 py-6">
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

        {!recommendations.isLoading && !recommendations.isError && visibleCandidates.length === 0 && unfavorableCandidates.length === 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
            لا يوجد معلمون متاحون لهذه الحصة حالياً.
          </div>
        )}

        {visibleCandidates.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold text-neutral-500">التوصيات الأفضل</p>
            {visibleCandidates.map((candidate) => (
              <CandidateCard key={`${candidate.teacherId}-${candidate.tier}`} candidate={candidate} isDisabled={mutation.isPending} onSelect={handleSelect} />
            ))}
          </div>
        )}

        {unfavorableCandidates.length > 0 && (
          <details className="group rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-neutral-600 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30">
              <span className="flex items-center justify-between">
                عرض الخيارات غير المحبذة
                <span className="text-xs font-normal text-neutral-400">{unfavorableCandidates.length} خيارات</span>
              </span>
            </summary>
            <div className="mt-3 flex flex-col gap-3 border-t border-neutral-200 pt-3">
              {unfavorableCandidates.map((candidate) => (
                <CandidateCard key={`${candidate.teacherId}-${candidate.tier}`} candidate={candidate} isDisabled={mutation.isPending} onSelect={handleSelect} />
              ))}
            </div>
          </details>
        )}

        {mutation.isPending && (
          <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
            <Check size={15} className="text-emerald-600" /> جارٍ تثبيت البديل...
          </div>
        )}
      </div>
    </ModalShell>
  );
}
