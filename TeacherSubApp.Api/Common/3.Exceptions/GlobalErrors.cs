using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Common.Exceptions
{
    public static class GlobalErrors
    {
        public static readonly Error DatabaseError = new(
            "DB_ERROR", 
            "A database operation failed. Please check your data and try again.",
            "فشلت عملية قاعدة البيانات. يرجى التحقق من البيانات والمحاولة مرة أخرى."
        );

        public static readonly Error InternalServerError = new(
            "SERVER_ERROR",
            "An unexpected error occurred.",
            "حدث خطأ غير متوقع في الخادم."
        );

        public static Error ValidationError(string messageEn, string messageAr) => new(
            "VALIDATION_ERROR",
            messageEn,
            messageAr
        );
    }
}