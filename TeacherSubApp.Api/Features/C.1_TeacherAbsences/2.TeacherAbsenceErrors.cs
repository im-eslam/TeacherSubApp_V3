using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Features.TeacherAbsences
{
    public static class TeacherAbsenceErrors
    {
        public static class Validation
        {
            public const string TeacherIdRequired = "A teacher must be assigned to this absence.|يجب تحديد معلم لسجل الغياب.";
            public const string AbsenceDateRequired = "The absence date is required.|تاريخ الغياب مطلوب.";
            public const string ReasonMaxLength = "The reason cannot exceed 500 characters.|لا يمكن أن يتجاوز السبب 500 حرف.";
        }

        public static readonly Error NotFound = Error.Create(
            "TEACHER_ABSENCE_NOT_FOUND",
            "The requested teacher absence record was not found.",
            "لم يتم العثور على سجل الغياب المطلوب.");

        public static readonly Error TeacherInvalid = Error.Create(
            "TEACHER_ABSENCE_TEACHER_INVALID",
            "The specified teacher does not exist or is not active.",
            "المعلم المحدد غير موجود أو غير نشط.");

        public static readonly Error DateConflict = Error.Create(
            "TEACHER_ABSENCE_DATE_CONFLICT",
            "This teacher already has an active absence record for the specified date.",
            "يوجد سجل غياب نشط لهذا المعلم في التاريخ المحدد بالفعل.");
    }
}
