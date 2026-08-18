using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Features.SchoolClasses
{
    public static class SchoolClassErrors
    {
        public static readonly Error NotFound = new(
            "CLASS_NOT_FOUND",
            "The requested class was not found.",
            "لم يتم العثور على الصف."
        );

        public static readonly Error NameExists = new(
            "CLASS_NAME_EXISTS",
            "An active class with this name already exists.",
            "يوجد صف نشط بهذا الاسم بالفعل."
        );

        public static readonly Error GradeSectionPairRequired = new(
            "CLASS_GRADE_SECTION_PAIR_REQUIRED",
            "Both Grade and Section must be provided together, or both left empty.",
            "يجب توفير الصف والشعبة معاً أو تركهما معاً."
        );

        public static readonly Error GradeSectionExists = new(
            "CLASS_GRADE_SECTION_EXISTS",
            "A class with the same grade and section already exists.",
            "يوجد صف بنفس الصف والشعبة بالفعل."
        );
    }
}