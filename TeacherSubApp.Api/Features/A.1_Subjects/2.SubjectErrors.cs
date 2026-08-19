using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Features.Subjects
{
    public static class SubjectErrors
    {
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
