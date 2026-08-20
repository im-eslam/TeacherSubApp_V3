using System.ComponentModel.DataAnnotations;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.WeeklySchedules.Dtos
{
    public sealed record WeeklyScheduleWriteDto
    {
        [Required(ErrorMessage = WeeklyScheduleErrors.Validation.TeacherIdRequired)]
        public int TeacherId { get; init; }

        [Range(1, 5, ErrorMessage = WeeklyScheduleErrors.Validation.DayOfWeekInvalid)]
        public int DayOfWeek { get; init; }

        [Range(1, 7, ErrorMessage = WeeklyScheduleErrors.Validation.PeriodNumberInvalid)]
        public int PeriodNumber { get; init; }

        public int? ClassId { get; init; }
        public int? EventId { get; init; }

        public WeeklySchedule ToEntity() => new()
        {
            TeacherId = TeacherId,
            DayOfWeek = DayOfWeek,
            PeriodNumber = PeriodNumber,
            ClassId = ClassId,
            EventId = EventId
        };
    }
}