using System.ComponentModel.DataAnnotations;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.SchoolClasses.Dtos
{
    public record SchoolClassWriteDto
    {
        [Required(ErrorMessage = "The class name is required.|اسم الصف مطلوب.")]
        [MaxLength(100, ErrorMessage = "The class name cannot exceed 100 characters.|لا يمكن أن يتجاوز اسم الصف 100 حرف.")]
        public string DisplayName { get; init; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "Grade must be greater than 0.|يجب أن يكون الصف أكبر من صفر.")]
        public int? Grade { get; init; }

        [Range(1, int.MaxValue, ErrorMessage = "Section must be greater than 0.|يجب أن يكون الشُعبة أكبر من صفر.")]
        public int? Section { get; init; }

        public static SchoolClass ToEntity(SchoolClassWriteDto dto)
        {
            return new SchoolClass
            {
                DisplayName = dto.DisplayName.Trim(),
                Grade = dto.Grade,
                Section = dto.Section
            };
        }
    }
}