using System.ComponentModel.DataAnnotations;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.Teachers.Dtos
{
    public sealed record TeacherWriteDto
    {
        [Required(ErrorMessage = TeacherErrors.Validation.NameRequired)]
        [MaxLength(100, ErrorMessage = TeacherErrors.Validation.NameMaxLength)]
        public string Name { get; init; } = string.Empty;

        public int? SubjectId { get; init; }
        public bool IsSupervisor { get; init; } = false;

        public Teacher ToEntity() => new()
        {
            Name = Name.Trim(),
            SubjectId = SubjectId,
            IsSupervisor = IsSupervisor
        };
    }
}