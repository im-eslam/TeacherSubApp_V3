using System.ComponentModel.DataAnnotations;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.Subjects.Dtos
{
    public record SubjectWriteDto
    {
        [Required(ErrorMessage = "The subject name is required.|اسم المادة مطلوب.")]
        [MaxLength(100, ErrorMessage = "The subject name cannot exceed 100 characters.|لا يمكن أن يتجاوز اسم المادة 100 حرف.")]
        public string Name { get; init; } = string.Empty;

        public Subject ToEntity() => new()
        {
            Name = Name.Trim()
        };
    }
}
