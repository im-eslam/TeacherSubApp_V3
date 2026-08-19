using System.ComponentModel.DataAnnotations;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.WeeklySchedules.Dtos
{
    public sealed record WeeklyScheduleWriteDto
    {
        [Range(1, int.MaxValue, ErrorMessage = WeeklyScheduleErrors.Validation.TeacherIdRequired)]
        public int TeacherId { get; init; }

        [Range(1, 5, ErrorMessage = WeeklyScheduleErrors.Validation.InvalidDayOfWeek)]
        public int DayOfWeek { get; init; }

        [Range(1, 7, ErrorMessage = WeeklyScheduleErrors.Validation.InvalidPeriodNumber)]
        public int PeriodNumber { get; init; }

        [Range(1, int.MaxValue)]
        public int? ClassId { get; init; }

        [Range(1, int.MaxValue)]
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
