using System.Linq.Expressions;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.Subjects.Dtos;

namespace TeacherSubApp.Api.Features.SchoolClasses.Dtos
{
    public record SchoolClassReadDto
    {
        public int Id { get; init; }
        public int? Grade { get; init; }
        public int? Section { get; init; }
        public string DisplayName { get; init; } = string.Empty;

        public static SchoolClassReadDto FromEntity(SchoolClass c)
        {
            return new SchoolClassReadDto
            {
                Id = c.Id,
                Grade = c.Grade,
                Section = c.Section,
                DisplayName = c.DisplayName
            };
        }

        public static readonly Expression<Func<SchoolClass, SchoolClassReadDto>> ToDtoProjection =
            c => new SchoolClassReadDto
            {
                Id = c.Id,
                Grade = c.Grade,
                Section = c.Section,
                DisplayName = c.DisplayName
            };
    }
}