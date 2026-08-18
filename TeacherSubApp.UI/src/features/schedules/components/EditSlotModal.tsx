import { useState } from "react";
import { Pencil, Trash2, ArrowLeftRight, ChevronRight } from "lucide-react";
import { ModalShell } from "../../../components/modals/ModalShell";
import { ModalHeader, ModalBody } from "../../../components/modals/ModalParts";
import { Button } from "../../../components/controls/Button";
import { TeacherWeekPicker, type PickedCell } from "./TeacherWeekPicker";
import { SlotContentFields } from "./SlotContentFields";
import { slotLabel } from "../lib/labels";
import type { TeacherReadDto } from "../../teachers/types";
import type { SchoolClassReadDto } from "../../classes/types";
import type { EventKeyReadDto } from "../../events/types";
import type { WeeklyScheduleReadDto, NewDraftRow } from "../types";

const STYLES = {
  footer:
    "flex items-center justify-between gap-2 px-6 py-4 border-t border-neutral-200/60 bg-neutral-50/50 shrink-0 rounded-b-3xl",
  footerRight: "flex items-center gap-2",
  backButton:
    "flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 rounded-lg px-1",
  targetSummary:
    "px-4 py-3 bg-neutral-100 rounded-xl text-sm font-semibold text-neutral-800",
  opGrid: "grid grid-cols-1 sm:grid-cols-3 gap-3",
  opCard: [
    "flex flex-col items-center gap-2.5 px-4 py-6 bg-white",
    "border border-neutral-200/80 rounded-2xl",
    "text-sm font-medium text-neutral-700 outline-none transition-all",
    "hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-sm",
    "focus-visible:ring-2 focus-visible:ring-blue-500/30",
  ].join(" "),
  opCardDestructive: "hover:border-red-300 hover:bg-red-50/40",
  opIcon:
    "flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-100 text-neutral-500",
  opIconDestructive:
    "flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-red-500",
};

export type EditSeed =
  | {
      key?: string;
      kind?: "add" | "edit";
      teacherId: number;
      teacherName: string;
      dayOfWeek: number;
      periodNumber: number;
      slotId: number | null;
      classId: number | null;
      eventId: number | null;
    }
  | {
      key?: string;
      kind: "swap";
      teacherId: number;
      teacherName: string;
      dayOfWeek: number;
      periodNumber: number;
      slotIdA: number;
      slotIdB: number;
      classId: number | null;
      eventId: number | null;
    };

type Step =
  | { name: "pick-cell" }
  | { name: "choose-op"; cell: PickedCell }
  | {
      name: "content";
      cell: PickedCell;
      classId: number | null;
      eventId: number | null;
    }
  | { name: "pick-swap-target"; cell: PickedCell };

export interface EditSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: TeacherReadDto[];
  classes: SchoolClassReadDto[];
  events: EventKeyReadDto[];
  getTeacherSlots: (teacherId: number) => WeeklyScheduleReadDto[];
  seed?: EditSeed;
  onStageRow: (row: NewDraftRow, options?: { replaceKey?: string }) => void;
}

export function EditSlotModal({
  isOpen,
  onClose,
  teachers,
  classes,
  events,
  getTeacherSlots,
  seed,
  onStageRow,
}: EditSlotModalProps) {
  const [step, setStep] = useState<Step>(() => seedToStep(seed));

  const replaceKey = seed?.key;

  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen && !wasOpen) {
    setWasOpen(true);
    setStep(seedToStep(seed));
  } else if (!isOpen && wasOpen) {
    setWasOpen(false);
  }

  const handleClose = () => {
    setStep({ name: "pick-cell" });
    onClose();
  };

  const title =
    step.name === "pick-cell"
      ? "اختيار حصة"
      : step.name === "choose-op"
        ? "اختر العملية"
        : step.name === "pick-swap-target"
          ? "اختر الحصة الثانية للتبديل"
          : step.cell.existing === null
            ? "إضافة حصة جديدة"
            : "تعديل محتوى الحصة";

  return (
    <ModalShell
      isOpen={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      size="xl"
    >
      <ModalHeader title={title} isBusy={false} onClose={handleClose} />
      <ModalBody>
        {step.name === "pick-cell" && (
          <TeacherWeekPicker
            teachers={teachers}
            getTeacherSlots={getTeacherSlots}
            onPick={(cell) => {
              if (cell.existing === null) {
                setStep({
                  name: "content",
                  cell,
                  classId: null,
                  eventId: null,
                });
              } else {
                setStep({ name: "choose-op", cell });
              }
            }}
          />
        )}

        {seed?.kind === "swap" && step.name === "pick-swap-target" && (
          <div className={STYLES.targetSummary}>
            {slotLabel(seed.teacherName, seed.dayOfWeek, seed.periodNumber)}
            {" ⇄ ?"}
          </div>
        )}

        {step.name === "choose-op" && (
          <>
            <div className={STYLES.targetSummary}>
              {slotLabel(
                step.cell.teacherName,
                step.cell.dayOfWeek,
                step.cell.periodNumber,
              )}
            </div>
            <div className={STYLES.opGrid}>
              <button
                type="button"
                className={STYLES.opCard}
                onClick={() =>
                  setStep({
                    name: "content",
                    cell: step.cell,
                    classId: step.cell.existing?.classId ?? null,
                    eventId: step.cell.existing?.eventId ?? null,
                  })
                }
              >
                <span className={STYLES.opIcon}>
                  <Pencil size={18} strokeWidth={2} />
                </span>
                تعديل المحتوى
              </button>
              <button
                type="button"
                className={STYLES.opCard}
                onClick={() =>
                  setStep({ name: "pick-swap-target", cell: step.cell })
                }
              >
                <span className={STYLES.opIcon}>
                  <ArrowLeftRight size={18} strokeWidth={2} />
                </span>
                تبديل مع حصة أخرى
              </button>
              <button
                type="button"
                className={`${STYLES.opCard} ${STYLES.opCardDestructive}`}
                onClick={() => {
                  const existing = step.cell.existing!;
                  onStageRow(
                    {
                      type: "delete",
                      slotId: existing.id,
                      teacherId: step.cell.teacherId,
                      teacherName: step.cell.teacherName,
                      dayOfWeek: step.cell.dayOfWeek,
                      periodNumber: step.cell.periodNumber,
                      before: {
                        classId: existing.classId,
                        classDisplayName: existing.classDisplayName,
                        eventId: existing.eventId,
                        eventName: existing.eventName,
                      },
                    },
                    replaceKey ? { replaceKey } : undefined,
                  );
                  handleClose();
                }}
              >
                <span className={STYLES.opIconDestructive}>
                  <Trash2 size={18} strokeWidth={2} />
                </span>
                حذف الحصة
              </button>
            </div>
          </>
        )}

        {step.name === "content" && (
          <>
            <div className={STYLES.targetSummary}>
              {slotLabel(
                step.cell.teacherName,
                step.cell.dayOfWeek,
                step.cell.periodNumber,
              )}
            </div>
            <SlotContentFields
              classes={classes}
              events={events}
              classId={step.classId}
              eventId={step.eventId}
              onClassChange={(id) =>
                setStep((s) =>
                  s.name === "content" ? { ...s, classId: id } : s,
                )
              }
              onEventChange={(id) =>
                setStep((s) =>
                  s.name === "content" ? { ...s, eventId: id } : s,
                )
              }
            />
          </>
        )}

        {step.name === "pick-swap-target" && (
          <>
            <div className={STYLES.targetSummary}>
              {slotLabel(
                step.cell.teacherName,
                step.cell.dayOfWeek,
                step.cell.periodNumber,
              )}
              {" ⇄ ؟"}
            </div>
            <TeacherWeekPicker
              teachers={teachers}
              getTeacherSlots={getTeacherSlots}
              requireOccupied
              excludeSlotId={step.cell.existing?.id}
              onPick={(target) => {
                const a = step.cell.existing!;
                const b = target.existing!;
                onStageRow(
                  {
                    type: "swap",
                    slotIdA: a.id,
                    slotIdB: b.id,
                    a: {
                      teacherId: step.cell.teacherId,
                      teacherName: step.cell.teacherName,
                      dayOfWeek: step.cell.dayOfWeek,
                      periodNumber: step.cell.periodNumber,
                      content: {
                        classId: a.classId,
                        classDisplayName: a.classDisplayName,
                        eventId: a.eventId,
                        eventName: a.eventName,
                      },
                    },
                    b: {
                      teacherId: target.teacherId,
                      teacherName: target.teacherName,
                      dayOfWeek: target.dayOfWeek,
                      periodNumber: target.periodNumber,
                      content: {
                        classId: b.classId,
                        classDisplayName: b.classDisplayName,
                        eventId: b.eventId,
                        eventName: b.eventName,
                      },
                    },
                  },
                  replaceKey ? { replaceKey } : undefined,
                );
                handleClose();
              }}
            />
          </>
        )}
      </ModalBody>

      <div className={STYLES.footer}>
        {step.name !== "pick-cell" ? (
          <button
            type="button"
            className={STYLES.backButton}
            onClick={() => setStep(backStep(step))}
          >
            <ChevronRight size={15} strokeWidth={2.5} />
            رجوع
          </button>
        ) : (
          <div />
        )}
        <div className={STYLES.footerRight}>
          <Button variant="quiet" onPress={handleClose}>
            إلغاء
          </Button>
          {step.name === "content" && (
            <Button
              variant="primary"
              onPress={() => {
                const isAdd = step.cell.existing === null;
                const content = {
                  classId: step.classId,
                  eventId: step.eventId,
                };
                const classDisplayName =
                  classes.find((c) => c.id === step.classId)?.displayName ??
                  null;
                const eventName =
                  events.find((e) => e.id === step.eventId)?.eventName ?? null;

                if (isAdd) {
                  onStageRow(
                    {
                      type: "add",
                      teacherId: step.cell.teacherId,
                      teacherName: step.cell.teacherName,
                      dayOfWeek: step.cell.dayOfWeek,
                      periodNumber: step.cell.periodNumber,
                      content: {
                        classId: content.classId,
                        classDisplayName,
                        eventId: content.eventId,
                        eventName,
                      },
                    },
                    replaceKey ? { replaceKey } : undefined,
                  );
                } else {
                  const existing = step.cell.existing!;
                  onStageRow(
                    {
                      type: "edit",
                      slotId: existing.id,
                      teacherId: step.cell.teacherId,
                      teacherName: step.cell.teacherName,
                      dayOfWeek: step.cell.dayOfWeek,
                      periodNumber: step.cell.periodNumber,
                      before: {
                        classId: existing.classId,
                        classDisplayName: existing.classDisplayName,
                        eventId: existing.eventId,
                        eventName: existing.eventName,
                      },
                      content: {
                        classId: content.classId,
                        classDisplayName,
                        eventId: content.eventId,
                        eventName,
                      },
                    },
                    replaceKey ? { replaceKey } : undefined,
                  );
                }
                handleClose();
              }}
              isDisabled={step.classId === null && step.eventId === null}
            >
              {step.cell.existing === null
                ? "إضافة إلى قائمة التغييرات"
                : "حفظ التعديل"}
            </Button>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

function seedToStep(seed?: EditSeed): Step {
  if (!seed) return { name: "pick-cell" };

  if (seed.kind === "swap") {
    return {
      name: "pick-swap-target",
      cell: {
        teacherId: seed.teacherId,
        teacherName: seed.teacherName,
        dayOfWeek: seed.dayOfWeek,
        periodNumber: seed.periodNumber,
        existing: {
          id: seed.slotIdA,
          teacherId: seed.teacherId,
          teacherName: seed.teacherName,
          teacherSubjectId: null,
          teacherSubjectName: null,
          dayOfWeek: seed.dayOfWeek,
          dayOfWeekName: "",
          periodNumber: seed.periodNumber,
          classId: seed.classId,
          classDisplayName: null,
          eventId: seed.eventId,
          eventName: null,
          eventIsSupport: false,
          eventIsStandby: false,
          isEmpty: seed.classId === null && seed.eventId === null,
        },
      },
    };
  }

  const cell: PickedCell = {
    teacherId: seed.teacherId,
    teacherName: seed.teacherName,
    dayOfWeek: seed.dayOfWeek,
    periodNumber: seed.periodNumber,
    existing:
      seed.slotId === null
        ? null
        : ({
            id: seed.slotId,
            teacherId: seed.teacherId,
            teacherName: seed.teacherName,
            teacherSubjectId: null,
            teacherSubjectName: null,
            dayOfWeek: seed.dayOfWeek,
            dayOfWeekName: "",
            periodNumber: seed.periodNumber,
            classId: seed.classId,
            classDisplayName: null,
            eventId: seed.eventId,
            eventName: null,
            eventIsSupport: false,
            eventIsStandby: false,
            isEmpty: seed.classId === null && seed.eventId === null,
          } as const),
  };
  return {
    name: "content",
    cell,
    classId: seed.classId,
    eventId: seed.eventId,
  };
}

function backStep(step: Step): Step {
  switch (step.name) {
    case "choose-op":
      return { name: "pick-cell" };
    case "content":
      return step.cell.existing === null
        ? { name: "pick-cell" }
        : { name: "choose-op", cell: step.cell };
    case "pick-swap-target":
      return { name: "choose-op", cell: step.cell };
    case "pick-cell":
      return step;
  }
}
