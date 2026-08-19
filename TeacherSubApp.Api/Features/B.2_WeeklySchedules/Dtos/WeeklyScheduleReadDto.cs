using System.Linq.Expressions;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.WeeklySchedules.Dtos
{
    public sealed record WeeklyScheduleReadDto(
        int Id,
        int TeacherId,
        int DayOfWeek,
        int PeriodNumber,
        int? ClassId,
        int? EventId,
        string? ClassDisplayName,
        string? EventName)
    {
        public static WeeklyScheduleReadDto FromEntity(WeeklySchedule schedule) =>
            new(
                schedule.Id,
                schedule.TeacherId,
                schedule.DayOfWeek,
                schedule.PeriodNumber,
                schedule.ClassId,
                schedule.EventId,
                schedule.SchoolClass?.DisplayName,
                schedule.EventKey?.EventName);

        public static readonly Expression<Func<WeeklySchedule, WeeklyScheduleReadDto>> ToDtoProjection =
            ws => new WeeklyScheduleReadDto(
                ws.Id,
                ws.TeacherId,
                ws.DayOfWeek,
                ws.PeriodNumber,
                ws.ClassId,
                ws.EventId,
                ws.SchoolClass == null ? null : ws.SchoolClass.DisplayName,
                ws.EventKey == null ? null : ws.EventKey.EventName);
    }
}
