using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Features.Teachers
{
    public static class TeacherErrors
    {
        public static readonly Error NotFound = new(
            "TEACHER_NOT_FOUND",
            "The requested teacher was not found.",
            "لم يتم العثور على المعلم."
        );

        public static readonly Error NameExists = new(
            "TEACHER_NAME_EXISTS",
            "An active teacher with this name already exists.",
            "يوجد معلم نشط بهذا الاسم بالفعل."
        );

        public static readonly Error SubjectInvalid = new(
            "TEACHER_SUBJECT_INVALID",
            "The assigned subject does not exist or is inactive.",
            "المادة الدراسية المعينة غير موجودة أو غير نشطة."
        );
    }
}