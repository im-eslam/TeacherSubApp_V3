using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Features.Substitutions
{
    public static class SubstitutionErrors
    {
        public static class Validation
        {
            public const string AbsenceIdRequired = "A teacher absence must be assigned to this substitution.|يجب تحديد سجل غياب لهذه المناوبة.";
            public const string WeeklyScheduleIdRequired = "A weekly schedule slot must be assigned to this substitution.|يجب تحديد حصة من الجدول الأسبوعي لهذه المناوبة.";
            public const string SubstituteTeacherIdRequired = "A substitute teacher must be assigned to this substitution.|يجب تحديد المعلم البديل لهذه المناوبة.";
            public const string ServiceDateRequired = "The service date is required.|تاريخ تنفيذ المناوبة مطلوب.";
        }

        public static readonly Error NotFound = Error.Create(
            "SUBSTITUTION_NOT_FOUND",
            "The requested substitution record was not found.",
            "لم يتم العثور على سجل المناوبة المطلوب.");

        public static readonly Error AbsenceInvalid = Error.Create(
            "SUBSTITUTION_ABSENCE_INVALID",
            "The specified teacher absence does not exist or is not active.",
            "سجل الغياب المحدد غير موجود أو غير نشط.");

        public static readonly Error WeeklyScheduleInvalid = Error.Create(
            "SUBSTITUTION_WEEKLY_SCHEDULE_INVALID",
            "The specified weekly schedule slot does not exist or is not active.",
            "حصة الجدول الأسبوعي المحددة غير موجودة أو غير نشطة.");

        public static readonly Error WeeklyScheduleEventOnlyNotAllowed = Error.Create(
            "SUBSTITUTION_WEEKLY_SCHEDULE_EVENT_ONLY_NOT_ALLOWED",
            "A substitution cannot be created for a schedule slot that is an event only, with no class assigned.",
            "لا يمكن إنشاء مناوبة لحصة في الجدول تكون مخصصة لفعالية فقط بدون تحديد فصل.");

        public static readonly Error SubstituteTeacherInvalid = Error.Create(
            "SUBSTITUTION_SUBSTITUTE_TEACHER_INVALID",
            "The specified substitute teacher does not exist or is not active.",
            "المعلم البديل المحدد غير موجود أو غير نشط.");

        public static readonly Error SubstituteDoubleBooked = Error.Create(
            "SUBSTITUTION_SUBSTITUTE_DOUBLE_BOOKED",
            "The substitute teacher is already assigned to another substitution at the same date and period.",
            "المعلم البديل مُكلّف بمناوبة أخرى في التاريخ والحصة نفسيهما بالفعل.");

        public static readonly Error SubstituteCannotBeAbsentTeacher = Error.Create(
            "SUBSTITUTION_SUBSTITUTE_CANNOT_BE_ABSENT_TEACHER",
            "The substitute teacher cannot be the teacher recorded as absent.",
            "لا يمكن أن يكون المعلم البديل هو المعلم المسجل كغائب.");

        public static readonly Error SlotAlreadySubstituted = Error.Create(
            "SUBSTITUTION_SLOT_ALREADY_SUBSTITUTED",
            "This weekly schedule slot already has an active substitution recorded for this date.",
            "توجد بالفعل مناوبة نشطة مسجلة لهذه الحصة في هذا التاريخ.");

        public static readonly Error ServiceDateAbsenceMismatch = Error.Create(
    "SUBSTITUTION_SERVICE_DATE_ABSENCE_MISMATCH",
    "The substitution service date must match the date of the linked teacher absence.",
    "يجب أن يتطابق تاريخ تنفيذ المناوبة مع تاريخ غياب المعلم المرتبط.");

        public static readonly Error ServiceDateDayOfWeekMismatch = Error.Create(
            "SUBSTITUTION_SERVICE_DATE_DAYOFWEEK_MISMATCH",
            "The substitution service date does not fall on the weekly schedule slot's assigned day of week.",
            "تاريخ تنفيذ المناوبة لا يوافق يوم الأسبوع المحدد لهذه الحصة في الجدول.");
    }
}
