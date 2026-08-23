using System.ComponentModel.DataAnnotations;

namespace TeacherSubApp.Api.Features.SubstituteMatching.Dtos
{
    public sealed record AlgorithmSettingsDto(
        [Range(0, 100, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.SubjectMatchWeightInvalid)]
        double SubjectMatchWeight,

        [Range(0, 100, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.WeeklyLoadWeightInvalid)]
        double WeeklyLoadWeight,

        [Range(0, 100, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.DailyLoadWeightInvalid)]
        double DailyLoadWeight,

        [Range(0, 100, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.StandbyWeightInvalid)]
        double StandbyWeight,

        [Range(0, 100, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.SubbedYesterdayWeightInvalid)]
        double SubbedYesterdayWeight,

        [Range(0, 100, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.ConsecutiveClassWeightInvalid)]
        double ConsecutiveClassWeight,

        [Range(0, 100, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.EarlyLeaveWeightInvalid)]
        double EarlyLeaveWeight,


        [Range(1, 40, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.OvertimeThresholdInvalid)]
        int OvertimeThreshold,

        [Range(0, 20, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.LowLoadThresholdInvalid)]
        int LowLoadThreshold,

        [Range(1, 12, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.DailyLoadThresholdInvalid)]
        int DailyLoadThreshold,

        [Range(1, 7, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.RestPeriodBreakInvalid)]
        int RestPeriodBreak
    );
}