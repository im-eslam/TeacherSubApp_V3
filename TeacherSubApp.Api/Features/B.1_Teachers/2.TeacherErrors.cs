using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Features.Teachers
{
    public static class TeacherErrors
    {
        public static class Validation
        {
            public const string NameRequired = "The teacher name is required.|اسم المعلم مطلوب.";
            public const string NameMaxLength = "The teacher name cannot exceed 100 characters.|لا يمكن أن يتجاوز اسم المعلم 100 حرف.";
        }

        public static readonly Error NotFound = Error.Create(
            "TEACHER_NOT_FOUND",
            "The requested teacher was not found.",
            "لم يتم العثور على المعلم."
        );

        public static readonly Error NameExists = Error.Create(
            "TEACHER_NAME_EXISTS",
            "An active teacher with this name already exists.",
            "يوجد معلم نشط بهذا الاسم بالفعل."
        );

        public static readonly Error SubjectInvalid = Error.Create(
            "TEACHER_SUBJECT_INVALID",
            "The assigned subject does not exist or is inactive.",
            "المادة الدراسية المعينة غير موجودة أو غير نشطة."
        );
    }
}