using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Features.Subjects
{
    public static class SubjectErrors
    {
        public static class Validation
        {
            public const string NameRequired = "The subject name is required.|اسم المادة مطلوب.";
            public const string NameMaxLength = "The subject name cannot exceed 100 characters.|لا يمكن أن يتجاوز اسم المادة 100 حرف.";
        }

        public static readonly Error NotFound = Error.Create(
            "SUBJECT_NOT_FOUND",
            "The requested subject was not found.",
            "لم يتم العثور على المادة الدراسية."
        );

        public static readonly Error NameExists = Error.Create(
            "SUBJECT_NAME_EXISTS",
            "An active subject with this name already exists.",
            "توجد مادة دراسية نشطة بهذا الاسم بالفعل."
        );
    }
}
