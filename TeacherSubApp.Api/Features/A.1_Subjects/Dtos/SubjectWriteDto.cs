using System.ComponentModel.DataAnnotations;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.Subjects.Dtos
{
    public sealed record SubjectWriteDto
    {
        [Required(ErrorMessage = SubjectErrors.Validation.NameRequired)]
        [MaxLength(100, ErrorMessage = SubjectErrors.Validation.NameMaxLength)]
        public string Name { get; init; } = string.Empty;

        public Subject ToEntity() => new()
        {
            Name = Name.Trim()
        };
    }
}
