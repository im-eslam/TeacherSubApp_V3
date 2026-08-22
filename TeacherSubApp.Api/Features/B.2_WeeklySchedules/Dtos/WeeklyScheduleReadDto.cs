using System.Linq.Expressions;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.WeeklySchedules.Dtos
{
    public sealed record WeeklyScheduleReadDto(
        int Id,
        int TeacherId,
        string TeacherName,
        string? SubjectName,
        int DayOfWeek,
        int PeriodNumber,
        int? ClassId,
        string? ClassDisplayName,
        int? EventId,
        string? EventName)
    {
        public static WeeklyScheduleReadDto FromEntity(WeeklySchedule ws) =>
            new(
                ws.Id,
                ws.TeacherId,
                ws.Teacher.Name,
                ws.Teacher.Subject?.Name,
                ws.DayOfWeek,
                ws.PeriodNumber,
                ws.ClassId,
                ws.SchoolClass?.DisplayName,
                ws.EventId,
                ws.EventKey?.EventName
            );

        public static readonly Expression<Func<WeeklySchedule, WeeklyScheduleReadDto>> ToDtoProjection = ws =>
            new WeeklyScheduleReadDto(
                ws.Id,
                ws.TeacherId,
                ws.Teacher.Name,
                ws.Teacher.Subject != null ? ws.Teacher.Subject.Name : null,
                ws.DayOfWeek,
                ws.PeriodNumber,
                ws.ClassId,
                ws.SchoolClass != null ? ws.SchoolClass.DisplayName : null,
                ws.EventId,
                ws.EventKey != null ? ws.EventKey.EventName : null
            );
    }
}