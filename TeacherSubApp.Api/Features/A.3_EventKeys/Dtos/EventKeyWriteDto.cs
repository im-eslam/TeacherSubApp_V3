using System.ComponentModel.DataAnnotations;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.EventKeys.Dtos
{
    public record EventKeyWriteDto
    {
        [Required(ErrorMessage = EventKeyErrors.Validation.NameRequired)]
        [MaxLength(100, ErrorMessage = EventKeyErrors.Validation.NameMaxLength)]
        public string EventName { get; init; } = string.Empty;

        public bool IsSupport { get; init; }
        public bool IsStandby { get; init; }

        public EventKey ToEntity() => new()
        {
            EventName = EventName.Trim(),
            IsSupport = IsSupport,
            IsStandby = IsStandby
        };
    }
}
