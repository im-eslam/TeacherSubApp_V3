import { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { ModalShell } from "../../../components/modals/ModalShell";
import { ModalHeader, ModalBody } from "../../../components/modals/ModalParts";
import { Button } from "../../../components/controls/Button";
import { DraftRowCard } from "./DraftRowCard";
import { EditSlotModal, type EditSeed } from "./EditSlotModal";
import { useWeeklyScheduleDraft, useBulkUpdateSchedule } from "../hooks";
import {
  isBulkErrorResponse,
  type DraftRowAdd,
  type DraftRowEdit,
  type DraftRowSwap,
  type NewDraftRow,
  type WeeklyScheduleReadDto,
} from "../types";
import { getErrorMessage } from "../../../lib/apiErrors";
import { isApiError, type ApiError } from "../../../lib/apiClient";
import type { TeacherReadDto } from "../../teachers/types";
import type { SchoolClassReadDto } from "../../classes/types";
import type { EventKeyReadDto } from "../../events/types";

const STYLES = {
  footer:
    "flex items-center justify-between gap-3 px-6 py-4 border-t border-neutral-200/60 bg-neutral-50/50 shrink-0 rounded-b-3xl",
  footerLeft: "flex items-center gap-2",
  footerRight: "flex items-center gap-2",
  dirtyBadge:
    "text-xs font-medium text-neutral-500 px-2.5 py-1 bg-neutral-100 rounded-full",
  bodyGrid: "grid gap-5",
  bodyGridWithErrors: "grid gap-5 lg:grid-cols-[1fr_288px]",
  changesList: "flex flex-col gap-2",
  addSlotButton: [
    "flex items-center justify-center gap-1.5 w-full px-4 py-3 min-h-[48px]",
    "text-sm font-medium text-blue-600",
    "bg-blue-50/60 border border-dashed border-blue-200 rounded-xl",
    "hover:bg-blue-50 transition-colors outline-none",
    "focus-visible:ring-2 focus-visible:ring-blue-500/30",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  emptyWrap:
    "flex flex-col items-center justify-center gap-2.5 py-14 text-center px-4",
  emptyIcon:
    "flex items-center justify-center w-14 h-14 rounded-3xl bg-neutral-100 text-neutral-400",
  emptyTitle: "text-sm font-semibold text-neutral-900 mt-1",
  emptySubtitle: "text-xs text-neutral-400 leading-relaxed max-w-xs",
  errorPanel:
    "flex flex-col gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl self-start",
  errorPanelTitle: "flex items-center gap-2 text-sm font-semibold text-red-700",
  errorPanelCount:
    "ml-auto text-[11px] font-medium bg-red-100 text-red-600 px-2 py-0.5 rounded-full",
  errorList: "flex flex-col gap-2",
  errorItem: "flex items-start gap-2 text-xs text-red-600 leading-relaxed",
  errorBullet: "shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-red-400",
  errorFootnote:
    "text-[11px] text-red-500 leading-relaxed border-t border-red-200/60 pt-2 mt-1",
};

export interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: TeacherReadDto[];
  classes: SchoolClassReadDto[];
  events: EventKeyReadDto[];
  getTeacherSlots: (teacherId: number) => WeeklyScheduleReadDto[];
  onSaved?: () => void;
}

export function BulkEditModal({
  isOpen,
  onClose,
  teachers,
  classes,
  events,
  getTeacherSlots,
  onSaved,
}: BulkEditModalProps) {
  const draft = useWeeklyScheduleDraft();
  const bulkUpdate = useBulkUpdateSchedule();

  const [editSlotOpen, setEditSlotOpen] = useState(false);
  const [editSeed, setEditSeed] = useState<EditSeed | undefined>(undefined);

  const [generalError, setGeneralError] = useState<ApiError | null>(null);
  const [detailedErrors, setDetailedErrors] = useState<ApiError[]>([]);
  const hasErrors = generalError !== null || detailedErrors.length > 0;

  const openAddFlow = () => {
    setEditSeed(undefined);
    setEditSlotOpen(true);
  };

  const openEditFlow = (row: DraftRowAdd | DraftRowEdit | DraftRowSwap) => {
    let seed: EditSeed;

    if (row.type === "add") {
      seed = {
        key: row.key,
        kind: "add",
        teacherId: row.teacherId,
        teacherName: row.teacherName,
        dayOfWeek: row.dayOfWeek,
        periodNumber: row.periodNumber,
        slotId: null,
        classId: row.content.classId,
        eventId: row.content.eventId,
      };
    } else if (row.type === "edit") {
      seed = {
        key: row.key,
        kind: "edit",
        teacherId: row.teacherId,
        teacherName: row.teacherName,
        dayOfWeek: row.dayOfWeek,
        periodNumber: row.periodNumber,
        slotId: row.slotId,
        classId: row.content.classId,
        eventId: row.content.eventId,
      };
    } else {
      seed = {
        key: row.key,
        kind: "swap",
        teacherId: row.a.teacherId,
        teacherName: row.a.teacherName,
        dayOfWeek: row.a.dayOfWeek,
        periodNumber: row.a.periodNumber,
        slotIdA: row.slotIdA,
        slotIdB: row.slotIdB,
        classId: row.a.content.classId,
        eventId: row.a.content.eventId,
      };
    }

    setEditSeed(seed);
    setEditSlotOpen(true);
  };

  const handleStageRow = (
    row: NewDraftRow,
    options?: { replaceKey?: string },
  ) => {
    switch (row.type) {
      case "add":
        draft.stageAdd(row, options);
        break;
      case "edit":
        draft.stageEdit(row, options);
        break;
      case "delete":
        draft.stageDelete(row, options);
        break;
      case "swap":
        draft.stageSwap(row, options);
        break;
    }
  };

  const handleSave = async () => {
    setGeneralError(null);
    setDetailedErrors([]);
    try {
      await bulkUpdate.mutateAsync(draft.toBulkDto());
      toast.success("تم حفظ التغييرات بنجاح");
      draft.reset();
      onSaved?.();
      onClose();
    } catch (err) {
      if (isBulkErrorResponse(err)) {
        setGeneralError({
          errorCode: err.errorCode,
          errorMessageEn: err.errorMessageEn,
          errorMessageAr: err.errorMessageAr,
          traceId: err.traceId,
        });
        setDetailedErrors(err.detailedErrors);
        toast.error(`فشل الحفظ — ${err.detailedErrors.length} خطأ في التحقق`);
      } else if (isApiError(err)) {
        setGeneralError(err);
        toast.error(err.errorMessageAr);
      } else {
        const msg = getErrorMessage(err);
        setGeneralError({
          errorCode: "UNKNOWN_ERROR",
          errorMessageEn: "Unknown error",
          errorMessageAr: msg,
        });
        toast.error(msg);
      }
    }
  };

  const handleClose = () => {
    draft.reset();
    setGeneralError(null);
    setDetailedErrors([]);
    onClose();
  };

  return (
    <>
      <ModalShell
        isOpen={isOpen && !editSlotOpen}
        onOpenChange={(open) => !open && handleClose()}
        isBusy={bulkUpdate.isPending}
        size="xl"
      >
        <ModalHeader
          title="تعديل الجدول الأسبوعي"
          isBusy={bulkUpdate.isPending}
          onClose={handleClose}
        />
        <ModalBody>
          <div
            className={hasErrors ? STYLES.bodyGridWithErrors : STYLES.bodyGrid}
          >
            <div className="flex flex-col gap-3 min-w-0">
              {draft.rowList.length === 0 ? (
                <div className={STYLES.emptyWrap}>
                  <div className={STYLES.emptyIcon}>
                    <Plus size={24} strokeWidth={1.5} />
                  </div>
                  <p className={STYLES.emptyTitle}>لا توجد تغييرات بعد</p>
                  <p className={STYLES.emptySubtitle}>
                    اختر حصة لإضافتها أو تعديلها أو حذفها أو تبديلها.
                  </p>
                </div>
              ) : (
                <div className={STYLES.changesList}>
                  {draft.rowList.map((row) => (
                    <DraftRowCard
                      key={row.key}
                      row={row}
                      onRemove={() => draft.removeRow(row.key)}
                      onEdit={
                        row.type === "add" ||
                        row.type === "edit" ||
                        row.type === "swap"
                          ? () => openEditFlow(row)
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}

              <button
                type="button"
                className={STYLES.addSlotButton}
                onClick={openAddFlow}
                disabled={bulkUpdate.isPending}
              >
                <Plus size={16} strokeWidth={2.5} />
                اختيار حصة لإضافة تغيير
              </button>
            </div>

            {hasErrors && (
              <div className={STYLES.errorPanel}>
                <div className={STYLES.errorPanelTitle}>
                  <AlertTriangle size={15} strokeWidth={2.25} />
                  أخطاء التحقق
                  <span className={STYLES.errorPanelCount}>
                    {detailedErrors.length > 0 ? detailedErrors.length : 1}
                  </span>
                </div>

                <div className={STYLES.errorList}>
                  {detailedErrors.length > 0
                    ? detailedErrors.map((e, i) => (
                        <div key={i} className={STYLES.errorItem}>
                          <span className={STYLES.errorBullet} />
                          <span>{e.errorMessageAr}</span>
                        </div>
                      ))
                    : generalError && (
                        <div className={STYLES.errorItem}>
                          <span className={STYLES.errorBullet} />
                          <span>{generalError.errorMessageAr}</span>
                        </div>
                      )}
                </div>

                <p className={STYLES.errorFootnote}>
                  راجع قائمة التغييرات وعدّلها حسب الحاجة، ثم حاول الحفظ مجدداً.
                </p>
              </div>
            )}
          </div>
        </ModalBody>

        <div className={STYLES.footer}>
          <div className={STYLES.footerLeft}>
            {draft.dirtyCount > 0 && (
              <span className={STYLES.dirtyBadge}>
                {draft.dirtyCount}{" "}
                {draft.dirtyCount === 1 ? "تغيير معلّق" : "تغييرات معلّقة"}
              </span>
            )}
          </div>
          <div className={STYLES.footerRight}>
            <Button
              variant="quiet"
              onPress={handleClose}
              isDisabled={bulkUpdate.isPending}
            >
              إغلاق
            </Button>
            <Button
              variant="primary"
              onPress={handleSave}
              isDisabled={draft.isEmpty || bulkUpdate.isPending}
            >
              {bulkUpdate.isPending ? "جارٍ الحفظ..." : "التحقق والحفظ"}
            </Button>
          </div>
        </div>
      </ModalShell>

      <EditSlotModal
        isOpen={editSlotOpen}
        onClose={() => setEditSlotOpen(false)}
        teachers={teachers}
        classes={classes}
        events={events}
        getTeacherSlots={getTeacherSlots}
        seed={editSeed}
        onStageRow={handleStageRow}
      />
    </>
  );
}
