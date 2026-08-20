using System.ComponentModel.DataAnnotations;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.TeacherAbsences;

namespace TeacherSubApp.Api.Features.TeacherAbsences.Dtos
{
    public sealed record TeacherAbsenceWriteDto
    {
        [Required(ErrorMessage = TeacherAbsenceErrors.Validation.TeacherIdRequired)]
        public int TeacherId { get; init; }

        [Required(ErrorMessage = TeacherAbsenceErrors.Validation.AbsenceDateRequired)]
        public DateOnly AbsenceDate { get; init; }

        [MaxLength(500, ErrorMessage = TeacherAbsenceErrors.Validation.ReasonMaxLength)]
        public string? Reason { get; init; }

        public TeacherAbsence ToEntity() => new()
        {
            TeacherId = TeacherId,
            AbsenceDate = AbsenceDate,
            Reason = Reason?.Trim()
        };
    }
}
