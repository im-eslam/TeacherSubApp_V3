using System.ComponentModel.DataAnnotations;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.EventKeys.Dtos
{
    public record EventKeyWriteDto
    {
        [Required(ErrorMessage = "The event name is required.|اسم الحدث مطلوب.")]
        [MaxLength(100, ErrorMessage = "The event name cannot exceed 100 characters.|لا يمكن أن يتجاوز اسم الحدث 100 حرف.")]
        public string EventName { get; init; } = string.Empty;

        public bool IsSupport { get; init; }
        public bool IsStandby { get; init; }

        public static EventKey ToEntity(EventKeyWriteDto dto)
        {
            return new EventKey
            {
                EventName = dto.EventName.Trim(),
                IsSupport = dto.IsSupport,
                IsStandby = dto.IsStandby
            };
        }
    }
}