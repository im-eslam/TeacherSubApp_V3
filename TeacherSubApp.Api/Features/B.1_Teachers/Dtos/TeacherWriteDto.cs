using System.ComponentModel.DataAnnotations;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.Teachers.Dtos
{
    public record TeacherWriteDto
    {
        [Required(ErrorMessage = "The teacher name is required.|اسم المعلم مطلوب.")]
        [MaxLength(100, ErrorMessage = "The teacher name cannot exceed 100 characters.|لا يمكن أن يتجاوز اسم المعلم 100 حرف.")]
        public string Name { get; init; } = string.Empty;

        public int? SubjectId { get; init; }
        public bool IsSupervisor { get; init; } = false;

        public static Teacher ToEntity(TeacherWriteDto dto)
        {
            return new Teacher
            {
                Name = dto.Name.Trim(),
                SubjectId = dto.SubjectId,
                IsSupervisor = dto.IsSupervisor
            };
        }
    }
}