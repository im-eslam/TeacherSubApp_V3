using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Features.Reports
{
    public static class ReportErrors
    {
        public static class Validation
        {
            public const string TeacherIdRequired = "A teacher must be selected for this report.|يجب تحديد معلم لهذا التقرير.";
            public const string DateRangeInvalid = "The 'from' date cannot be after the 'to' date.|لا يمكن أن يكون تاريخ البداية بعد تاريخ النهاية.";
        }

        public static readonly Error TeacherNotFound = Error.Create(
            "REPORT_TEACHER_NOT_FOUND",
            "The requested teacher was not found.",
            "لم يتم العثور على المعلم المطلوب.");
    }
}