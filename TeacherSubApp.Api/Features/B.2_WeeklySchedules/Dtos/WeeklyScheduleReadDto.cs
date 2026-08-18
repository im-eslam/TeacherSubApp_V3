using System.Linq.Expressions;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.WeeklySchedules.Models;

namespace TeacherSubApp.Api.Features.WeeklySchedules.Dtos
{
    public record WeeklyScheduleReadDto
    {
        public int Id { get; init; }

        public int TeacherId { get; init; }
        public string TeacherName { get; init; } = string.Empty;

        public int? TeacherSubjectId { get; init; }
        public string? TeacherSubjectName { get; init; }

        public int DayOfWeek { get; init; }
        public string DayOfWeekName => ScheduleDay.NameEn(DayOfWeek);

        public int PeriodNumber { get; init; }

        public int? ClassId { get; init; }
        public string? ClassDisplayName { get; init; }

        public int? EventId { get; init; }
        public string? EventName { get; init; }
        public bool EventIsSupport { get; init; }
        public bool EventIsStandby { get; init; }

        public bool IsEmpty => ClassId is null && EventId is null;

        public static WeeklyScheduleReadDto FromEntity(WeeklySchedule ws)
        {
            return new WeeklyScheduleReadDto
            {
                Id = ws.Id,
                TeacherId = ws.TeacherId,
                TeacherName = ws.Teacher?.Name ?? string.Empty,
                TeacherSubjectId = ws.Teacher?.SubjectId,
                TeacherSubjectName = ws.Teacher?.Subject?.Name,
                DayOfWeek = ws.DayOfWeek,
                PeriodNumber = ws.PeriodNumber,
                ClassId = ws.ClassId,
                ClassDisplayName = ws.SchoolClass?.DisplayName,
                EventId = ws.EventId,
                EventName = ws.EventKey?.EventName,
                EventIsSupport = ws.EventKey?.IsSupport ?? false,
                EventIsStandby = ws.EventKey?.IsStandby ?? false,
            };
        }

        public static readonly Expression<Func<WeeklySchedule, WeeklyScheduleReadDto>> ToDtoProjection =
            ws => new WeeklyScheduleReadDto
            {
                Id = ws.Id,
                TeacherId = ws.TeacherId,
                TeacherName = ws.Teacher.Name,
                TeacherSubjectId = ws.Teacher.SubjectId,
                TeacherSubjectName = ws.Teacher.Subject != null ? ws.Teacher.Subject.Name : null,
                DayOfWeek = ws.DayOfWeek,
                PeriodNumber = ws.PeriodNumber,
                ClassId = ws.ClassId,
                ClassDisplayName = ws.SchoolClass != null ? ws.SchoolClass.DisplayName : null,
                EventId = ws.EventId,
                EventName = ws.EventKey != null ? ws.EventKey.EventName : null,
                EventIsSupport = ws.EventKey != null && ws.EventKey.IsSupport,
                EventIsStandby = ws.EventKey != null && ws.EventKey.IsStandby,
            };
    }

    public record WeeklyScheduleGridDto
    {
        public int? FilteredTeacherId { get; init; }
        public int? FilteredClassId { get; init; }

        public List<WeeklyScheduleReadDto> Slots { get; init; } = new();
    }
}