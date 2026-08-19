using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Features.WeeklySchedules
{
    public static class WeeklyScheduleErrors
    {
        public static class Validation
        {
            public const string TeacherIdRequired = "TeacherId is required.|معرّف المعلم مطلوب.";
            public const string InvalidDayOfWeek = "DayOfWeek must be between 1 and 5.|يجب أن يكون يوم الأسبوع بين 1 و5.";
            public const string InvalidPeriodNumber = "PeriodNumber must be between 1 and 7.|يجب أن تكون الحصة بين 1 و7.";
            public const string ClassOrEventRequired = "ClassId or EventId must be provided.|يجب توفير معرّف الصف أو معرّف الحدث.";
            public const string ClassAndEventMutuallyExclusive = "ClassId and EventId cannot both be provided.|لا يمكن توفير معرّف الصف ومعرّف الحدث معاً.";
            public const string BulkItemsRequired = "At least one weekly schedule is required.|يجب توفير جدول أسبوعي واحد على الأقل.";
            public const string InvalidReferenceId = "Reference identifiers must be positive.|يجب أن تكون معرّفات المراجع موجبة.";
        }

        public static readonly Error NotFound = Error.Create(
            "WEEKLY_SCHEDULE_NOT_FOUND",
            "The requested weekly schedule was not found.",
            "لم يتم العثور على الجدول الأسبوعي المطلوب.");

        public static readonly Error TeacherNotFound = Error.Create(
            "WEEKLY_SCHEDULE_TEACHER_NOT_FOUND",
            "The selected teacher was not found or is inactive.",
            "المعلم المحدد غير موجود أو غير نشط.");

        public static readonly Error ClassNotFound = Error.Create(
            "WEEKLY_SCHEDULE_CLASS_NOT_FOUND",
            "The selected class was not found or is inactive.",
            "الصف المحدد غير موجود أو غير نشط.");

        public static readonly Error EventNotFound = Error.Create(
            "WEEKLY_SCHEDULE_EVENT_NOT_FOUND",
            "The selected event-key was not found or is inactive.",
            "الحدث المحدد غير موجود أو غير نشط.");

        public static readonly Error BulkDuplicateIds = Error.Create(
            "WEEKLY_SCHEDULE_BULK_DUPLICATE_IDS",
            "Bulk update contains duplicate schedule identifiers.",
            "يحتوي التحديث الجماعي على معرّفات جداول مكررة.");

    }
}
