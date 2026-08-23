import {
  Activity,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Layers,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { DatePicker } from "../../../components/controls/DatePicker";
import { SearchableSelect } from "../../../components/controls/SearchableSelect";
import { Button } from "../../../components/controls/Button";
import { EntityErrorBanner } from "../../../components/layout/EntityPageLayout";
import { formatDateAsDayMonthYear } from "../../substitutions/dateUtils";
import { useReportsPage } from "../hooks";
import { LedgerTable } from "./LedgerTable";
import { StatCard } from "./StatCard";

type ReportsPageViewModel = ReturnType<typeof useReportsPage>;

interface TeacherReportViewProps {
  vm: ReportsPageViewModel;
}

export function TeacherReportView({ vm }: TeacherReportViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-neutral-500">المعلم</span>
            <SearchableSelect
              value={vm.teacherId ? String(vm.teacherId) : ""}
              onChange={(value) =>
                vm.setTeacherId(value ? Number(value) : null)
              }
              options={vm.teacherOptions}
              placeholder="اختر معلماً لعرض تقريره"
              disabled={vm.isTeachersLoading}
            />
          </div>

          <DatePicker
            label="من تاريخ"
            value={vm.teacherFromDate}
            onChange={vm.setTeacherFromDate}
          />
          <DatePicker
            label="إلى تاريخ"
            value={vm.teacherToDate}
            onChange={vm.setTeacherToDate}
          />

          {(vm.teacherFromDate || vm.teacherToDate) && (
            <Button variant="quiet" onPress={vm.clearTeacherRange}>
              <CalendarRange size={16} strokeWidth={2.5} />
              إلغاء الفترة
            </Button>
          )}
        </div>

        {vm.dateRangeInvalid && (
          <p className="text-xs font-medium text-red-600">
            لا يمكن أن يكون تاريخ البداية بعد تاريخ النهاية.
          </p>
        )}
      </div>

      {!vm.hasSelectedTeacher && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-neutral-50/60 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
            <Users size={27} />
          </span>
          <h2 className="mt-4 text-base font-bold text-neutral-900">
            اختر معلماً لعرض تقريره
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
            سيظهر هنا سجل الغياب، سجل التغطيات، وتحليل الحمل الأسبوعي لهذا
            المعلم.
          </p>
        </div>
      )}

      {vm.hasSelectedTeacher && vm.isTeacherReportError && (
        <EntityErrorBanner
          error={vm.teacherReportError}
          onRetry={vm.retryTeacherReport}
          isRetrying={vm.isTeacherReportRetrying}
        />
      )}

      {vm.hasSelectedTeacher && vm.isTeacherReportLoading && (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-neutral-200 bg-white py-16 text-sm text-neutral-500 shadow-sm">
          <Loader2 size={19} className="animate-spin" /> جارٍ تجهيز التقرير...
        </div>
      )}

      {vm.hasSelectedTeacher &&
        !vm.isTeacherReportLoading &&
        !vm.isTeacherReportError &&
        vm.teacherReport && (
          <>
            <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-blue-100 bg-blue-50/70 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <ShieldCheck size={19} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-neutral-900">
                  {vm.teacherReport.teacherName}
                </p>
                <p className="text-xs font-medium text-neutral-500">
                  {vm.teacherReport.subjectName ?? "بلا مادة"}
                  {vm.teacherReport.isSupervisor && " · مشرف"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard
                icon={Layers}
                value={vm.teacherReport.analysis.baseWeeklyLoad}
                label="الحصص الأساسية أسبوعياً"
                accent="neutral"
              />
              <StatCard
                icon={Activity}
                value={vm.teacherReport.analysis.actualWeeklyLoad}
                label="الحصص الفعلية أسبوعياً"
                accent="blue"
              />
              <StatCard
                icon={CalendarDays}
                value={vm.teacherReport.analysis.absenceDaysCount}
                label="أيام الغياب"
                accent="red"
              />
              <StatCard
                icon={ClipboardList}
                value={vm.teacherReport.analysis.totalFreedSlots}
                label="إجمالي الحصص المتأثرة"
                accent="red"
              />
              <StatCard
                icon={ShieldCheck}
                value={vm.teacherReport.analysis.totalCoveredSlots}
                label="إجمالي الحصص المغطاة"
                accent="emerald"
              />
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold text-neutral-900">سجل الغياب</h3>
              <LedgerTable
                items={vm.teacherReport.absences}
                getKey={(item) => item.absenceId}
                aria-label="سجل غياب المعلم"
                emptyIcon={<CalendarDays size={24} />}
                emptyTitle="لا يوجد غياب مسجل"
                emptySubtitle="لم يتم تسجيل أي غياب لهذا المعلم خلال الفترة المحددة."
                columns={[
                  {
                    id: "absenceDate",
                    label: "التاريخ",
                    isPrimary: true,
                    renderCell: (item) =>
                      formatDateAsDayMonthYear(item.absenceDate),
                  },
                  {
                    id: "reason",
                    label: "السبب",
                    renderCell: (item) => item.reason ?? "—",
                  },
                  {
                    id: "freedSlotsCount",
                    label: "الحصص المتأثرة",
                    renderCell: (item) => item.freedSlotsCount,
                  },
                  {
                    id: "coveredSlotsCount",
                    label: "الحصص المغطاة",
                    renderCell: (item) => item.coveredSlotsCount,
                  },
                ]}
              />
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold text-neutral-900">
                سجل التغطيات
              </h3>
              <LedgerTable
                items={vm.teacherReport.substitutions}
                getKey={(item) => item.substitutionId}
                aria-label="سجل تغطيات المعلم"
                emptyIcon={<ClipboardList size={24} />}
                emptyTitle="لا توجد تغطيات مسجلة"
                emptySubtitle="لم يقم هذا المعلم بتغطية أي حصة خلال الفترة المحددة."
                columns={[
                  {
                    id: "serviceDate",
                    label: "التاريخ",
                    isPrimary: true,
                    renderCell: (item) =>
                      formatDateAsDayMonthYear(item.serviceDate),
                  },
                  {
                    id: "periodNumber",
                    label: "الحصة",
                    renderCell: (item) => item.periodNumber,
                  },
                  {
                    id: "classNameAtTimeOfService",
                    label: "الفصل",
                    renderCell: (item) => item.classNameAtTimeOfService,
                  },
                  {
                    id: "absentTeacherNameAtTimeOfService",
                    label: "غطى بدلاً عن",
                    renderCell: (item) => item.absentTeacherNameAtTimeOfService,
                  },
                  {
                    id: "isAlgorithmMatch",
                    label: "المصدر",
                    renderCell: (item) =>
                      item.isAlgorithmMatch ? (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                          ترشيح النظام
                        </span>
                      ) : (
                        <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-600">
                          اختيار يدوي
                        </span>
                      ),
                  },
                ]}
              />
            </div>
          </>
        )}
    </div>
  );
}
