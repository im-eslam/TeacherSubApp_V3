using System.ComponentModel.DataAnnotations;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.Substitutions;

namespace TeacherSubApp.Api.Features.Substitutions.Dtos
{
    public sealed record SubstitutionWriteDto
    {
        [Required(ErrorMessage = SubstitutionErrors.Validation.AbsenceIdRequired)]
        public int AbsenceId { get; init; }

        [Required(ErrorMessage = SubstitutionErrors.Validation.WeeklyScheduleIdRequired)]
        public int WeeklyScheduleId { get; init; }

        [Required(ErrorMessage = SubstitutionErrors.Validation.SubstituteTeacherIdRequired)]
        public int SubstituteTeacherId { get; init; }

        [Required(ErrorMessage = SubstitutionErrors.Validation.ServiceDateRequired)]
        public DateOnly ServiceDate { get; init; }

        public bool IsAlgorithmMatch { get; init; } = false;

        public Substitution ToEntity() => new()
        {
            AbsenceId = AbsenceId,
            WeeklyScheduleId = WeeklyScheduleId,
            SubstituteTeacherId = SubstituteTeacherId,
            ServiceDate = ServiceDate,
            IsAlgorithmMatch = IsAlgorithmMatch
        };
    }
}
