using System.ComponentModel.DataAnnotations;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.WeeklySchedules.Dtos
{
    public class WeeklyScheduleWriteDtos
    {
        public record WeeklyScheduleBulkUpdateDto
        {
            public List<WeeklyScheduleAddDto> Adds { get; init; } = new();
            public List<WeeklyScheduleEditDto> Edits { get; init; } = new();
            public List<int> Deletes { get; init; } = new();
            public List<WeeklyScheduleSwapDto> Swaps { get; init; } = new();
        }

        public record WeeklyScheduleAddDto
        {
            [Required(ErrorMessage = "Teacher ID is required.|معرف المعلم مطلوب.")]
            public int TeacherId { get; init; }

            [Required]
            [Range(1, 5, ErrorMessage = "Day must be between 1 and 5.|اليوم يجب أن يكون بين 1 و 5.")]
            public int DayOfWeek { get; init; }

            [Required]
            [Range(1, 7, ErrorMessage = "Period must be between 1 and 7.|رقم الحصة يجب أن يكون بين 1 و 7.")]
            public int PeriodNumber { get; init; }

            public int? ClassId { get; init; }
            public int? EventId { get; init; }

            public WeeklySchedule ToEntity()
            {
                return new WeeklySchedule
                {
                    TeacherId = TeacherId,
                    DayOfWeek = DayOfWeek,
                    PeriodNumber = PeriodNumber,
                    ClassId = ClassId,
                    EventId = EventId
                };
            }
        }

        public record WeeklyScheduleEditDto
        {
            [Required(ErrorMessage = "Schedule ID is required.|معرف الحصة مطلوب.")]
            public int Id { get; init; }

            public int? ClassId { get; init; }
            public int? EventId { get; init; }

            public void ApplyTo(WeeklySchedule existingEntity)
            {
                existingEntity.ClassId = ClassId;
                existingEntity.EventId = EventId;
                existingEntity.UpdatedAt = DateTime.UtcNow;
            }
        }

        public record WeeklyScheduleSwapDto
        {
            [Required(ErrorMessage = "First Schedule ID is required.|معرف الحصة الأولى مطلوب.")]
            public int ScheduleIdA { get; init; }

            [Required(ErrorMessage = "Second Schedule ID is required.|معرف الحصة الثانية مطلوب.")]
            public int ScheduleIdB { get; init; }
        }
    }
}