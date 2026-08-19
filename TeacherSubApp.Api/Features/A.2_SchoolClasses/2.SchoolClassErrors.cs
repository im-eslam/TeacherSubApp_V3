using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Features.SchoolClasses
{
    public static class SchoolClassErrors
    {
        public static class Validation
        {
            public const string DisplayNameRequired = "The class display name is required.|اسم الصف مطلوب.";
            public const string DisplayNameMaxLength = "The class display name cannot exceed 100 characters.|لا يمكن أن يتجاوز اسم الصف 100 حرف.";

            public const string InvalidGrade = "Grade must be greater than 0.|يجب أن يكون الصف أكبر من صفر.";
            public const string InvalidSection = "Section must be greater than 0.|يجب أن يكون الشُعبة أكبر من صفر.";
        }

        public static readonly Error NotFound = Error.Create(
            "CLASS_NOT_FOUND",
            "The requested class was not found.",
            "لم يتم العثور على الصف."
        );

        public static readonly Error NameExists = Error.Create(
            "CLASS_NAME_EXISTS",
            "An active class with this name already exists.",
            "يوجد صف نشط بهذا الاسم بالفعل."
        );

        public static readonly Error GradeSectionPairRequired = Error.Create(
            "CLASS_GRADE_SECTION_PAIR_REQUIRED",
            "Both Grade and Section must be provided together, or both left empty.",
            "يجب توفير الصف والشعبة معاً أو تركهما معاً."
        );

        public static readonly Error GradeSectionExists = Error.Create(
            "CLASS_GRADE_SECTION_EXISTS",
            "A class with the same grade and section already exists.",
            "يوجد صف بنفس الصف والشعبة بالفعل."
        );
    }
}