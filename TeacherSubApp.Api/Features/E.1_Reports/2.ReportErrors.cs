using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Features.Reports
{
    public static class ReportErrors
    {
        public static readonly Error TeacherNotFound = Error.Create(
            "REPORT_TEACHER_NOT_FOUND",
            "The specified teacher was not found.",
            "لم يتم العثور على المعلم المحدد.");

        public static readonly Error InvalidDateRange = Error.Create(
            "REPORT_INVALID_DATE_RANGE",
            "The 'from' date must be on or before the 'to' date.",
            "يجب أن يكون تاريخ البداية قبل تاريخ النهاية أو مساويًا له.");

        public static readonly Error DateRangeTooLarge = Error.Create(
            "REPORT_DATE_RANGE_TOO_LARGE",
            "The requested date range exceeds the maximum allowed span.",
            "النطاق الزمني المطلوب يتجاوز الحد الأقصى المسموح به.");

        public static readonly Error DateRequired = Error.Create(
            "REPORT_DATE_REQUIRED",
            "The report date is required.",
            "تاريخ التقرير مطلوب.");

        public static readonly Error InvalidTopCount = Error.Create(
            "REPORT_INVALID_TOP_COUNT",
            "The top count must be between 1 and 50.",
            "يجب أن يكون عدد النتائج الأعلى بين 1 و50.");
    }
}
