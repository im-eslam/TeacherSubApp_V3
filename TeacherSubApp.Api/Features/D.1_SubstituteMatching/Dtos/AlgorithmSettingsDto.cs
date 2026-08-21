using System.ComponentModel.DataAnnotations;

namespace TeacherSubApp.Api.Features.SubstituteMatching.Dtos
{
    public sealed record AlgorithmSettingsDto(
        [property: Range(0, 100, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.SubjectMatchWeightInvalid)]
        double SubjectMatchWeight,

        [property: Range(0, 100, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.WeeklyLoadWeightInvalid)]
        double WeeklyLoadWeight,

        [property: Range(0, 100, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.DailyLoadWeightInvalid)]
        double DailyLoadWeight,

        [property: Range(0, 100, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.StandbyWeightInvalid)]
        double StandbyWeight,

        [property: Range(0, 100, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.SubbedYesterdayWeightInvalid)]
        double SubbedYesterdayWeight,

        [property: Range(0, 100, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.ConsecutiveClassWeightInvalid)]
        double ConsecutiveClassWeight,

        [property: Range(0, 100, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.EarlyLeaveWeightInvalid)]
        double EarlyLeaveWeight,


        [property: Range(1, 40, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.OvertimeThresholdInvalid)]
        int OvertimeThreshold,

        [property: Range(0, 20, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.LowLoadThresholdInvalid)]
        int LowLoadThreshold,

        [property: Range(1, 12, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.DailyLoadThresholdInvalid)]
        int DailyLoadThreshold,

        [property: Range(1, 7, ErrorMessage = SubstituteMatchingErrors.SettingsValidation.RestPeriodBreakInvalid)]
        int RestPeriodBreak
    );
}