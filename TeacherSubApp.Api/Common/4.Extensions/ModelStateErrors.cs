using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Common.Extensions
{
    public static class ModelStateErrors
    {
        public static Error Default => Error.Create(
            "VALIDATION_ERROR",
            "Data validation failed. Review the data submitted.",
            "فشل التحقق من صحة البيانات المدخلة. يرجى مراجعة المدخلات."
        );

        public static Error Custom (string messageEn, string messageAr) => Error.Create(
            "VALIDATION_ERROR", messageEn, messageAr
        );
    }
}
