using System.ComponentModel.DataAnnotations;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.SchoolClasses.Dtos
{
    public sealed record SchoolClassWriteDto
    {
        [Required(ErrorMessage = SchoolClassErrors.Validation.DisplayNameRequired)]
        [MaxLength(100, ErrorMessage = SchoolClassErrors.Validation.DisplayNameMaxLength)]
        public string DisplayName { get; init; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = SchoolClassErrors.Validation.InvalidGrade)]
        public int? Grade { get; init; }

        [Range(1, int.MaxValue, ErrorMessage = SchoolClassErrors.Validation.InvalidSection)]
        public int? Section { get; init; }

        public SchoolClass ToEntity() => new()
        {
            DisplayName = DisplayName.Trim(),
            Grade = Grade,
            Section = Section
        };
    }
}