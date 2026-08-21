using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Features.SubstituteMatching
{
    public static class SubstituteMatchingErrors
    {
        public static class SettingsValidation
        {
            public const string SubjectMatchWeightInvalid = "Weight must be between 0 and 100.|يجب أن يكون الوزن بين 0 و 100.";
            public const string WeeklyLoadWeightInvalid = "Weight must be between 0 and 100.|يجب أن يكون الوزن بين 0 و 100.";
            public const string DailyLoadWeightInvalid = "Weight must be between 0 and 100.|يجب أن يكون الوزن بين 0 و 100.";
            public const string StandbyWeightInvalid = "Weight must be between 0 and 100.|يجب أن يكون الوزن بين 0 و 100.";
            public const string SubbedYesterdayWeightInvalid = "Weight must be between 0 and 100.|يجب أن يكون الوزن بين 0 و 100.";
            public const string ConsecutiveClassWeightInvalid = "Weight must be between 0 and 100.|يجب أن يكون الوزن بين 0 و 100.";
            public const string EarlyLeaveWeightInvalid = "Weight must be between 0 and 100.|يجب أن يكون الوزن بين 0 و 100.";
            public const string OvertimeThresholdInvalid = "Invalid threshold.|حد غير صالح.";
            public const string LowLoadThresholdInvalid = "Invalid threshold.|حد غير صالح.";
            public const string RestPeriodBreakInvalid = "Invalid break period.|فترة راحة غير صالحة.";
            public const string DailyLoadThresholdInvalid = "Invalid threshold.|حد غير صالح.";
        }

        public static readonly Error SettingsNotFound = Error.Create(
            "SUB_SETTINGS_NOT_FOUND",
            "Algorithm settings are not configured.",
            "إعدادات الخوارزمية غير مهيأة."
        );

        public static readonly Error InvalidWeightsSum = Error.Create(
            "SUB_INVALID_WEIGHTS_SUM",
            "The sum of all 7 weights must be exactly 100.",
            "مجموع الأوزان السبعة يجب أن يكون 100 بالضبط."
        );

        public static readonly Error AbsentTeacherNotFound = Error.Create(
            "SUB_ABSENT_TEACHER_NOT_FOUND",
            "Absent teacher not found.",
            "المعلم الغائب غير موجود."
        );

        public static readonly Error InvalidDayOfWeek = Error.Create(
            "SUB_INVALID_DAY",
            "Day of week must be between 1 and 5.",
            "يجب أن يكون يوم الأسبوع بين 1 و 5."
        );

        public static readonly Error InvalidPeriodNumber = Error.Create(
            "SUB_INVALID_PERIOD",
            "Period number must be greater than 0.",
            "يجب أن يكون رقم الحصة أكبر من 0."
        );
    }
}
