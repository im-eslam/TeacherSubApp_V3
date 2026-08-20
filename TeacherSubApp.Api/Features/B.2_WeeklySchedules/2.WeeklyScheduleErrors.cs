using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Features.WeeklySchedules
{
    public static class WeeklyScheduleErrors
    {
        public static class Validation
        {
            public const string DayOfWeekInvalid = "Day of week must be between 1 and 5.|يجب أن يكون يوم الأسبوع بين 1 و 5.";
            public const string PeriodNumberInvalid = "Period number must be between 1 and 7.|يجب أن يكون رقم الحصة بين 1 و 7.";
            public const string ClassOrEventRequired = "Either a class or an event must be assigned to the slot.|يجب تحديد صف أو حدث لهذه الحصة.";
            public const string TeacherIdRequired = "A teacher must be assigned to the slot.|يجب تحديد معلم لهذه الحصة.";
        }

        public static readonly Error NotFound = Error.Create(
            "WEEKLY_SCHEDULE_NOT_FOUND",
            "The requested weekly schedule slot was not found.",
            "لم يتم العثور على الحصة المطلوبة في الجدول الأسبوعي."
        );

        public static readonly Error ClassOrEventRequired = Error.Create(
            "WEEKLY_SCHEDULE_CLASS_OR_EVENT_REQUIRED",
            "Either a class or an event must be assigned to this slot.",
            "يجب تعيين صف أو حدث لهذه الحصة."
        );

        public static readonly Error TeacherInvalid = Error.Create(
            "WEEKLY_SCHEDULE_TEACHER_INVALID",
            "The assigned teacher does not exist or is inactive.",
            "المعلم المعين غير موجود أو غير نشط."
        );

        public static readonly Error ClassInvalid = Error.Create(
            "WEEKLY_SCHEDULE_CLASS_INVALID",
            "The assigned class does not exist or is inactive.",
            "الصف المعين غير موجود أو غير نشط."
        );

        public static readonly Error EventInvalid = Error.Create(
            "WEEKLY_SCHEDULE_EVENT_INVALID",
            "The assigned event does not exist or is inactive.",
            "الحدث المعين غير موجود أو غير نشط."
        );

        public static readonly Error HasActiveSubstitutions = Error.Create(
            "WEEKLY_SCHEDULE_HAS_ACTIVE_SUBSTITUTIONS",
            "This slot cannot be removed because it has active substitution history.",
            "لا يمكن حذف هذه الحصة لوجود سجل استبدال نشط مرتبط بها."
        );

        public static readonly Error BulkOperationInvalid = Error.Create(
            "WEEKLY_SCHEDULE_BULK_OPERATION_INVALID",
            "One or more items in the batch failed and the entire batch was rolled back.",
            "فشل عنصر واحد أو أكثر في الدفعة وتم التراجع عن الدفعة بأكملها."
        );
    }
}