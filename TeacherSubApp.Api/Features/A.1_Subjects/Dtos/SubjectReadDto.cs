using System.Linq.Expressions;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.Subjects.Dtos
{
    public record SubjectReadDto
    {
        public int Id { get; init; }

        public string Name { get; init; } = string.Empty;

        public static SubjectReadDto FromEntity(Subject subject)
        {
            return new SubjectReadDto
            {
                Id = subject.Id,
                Name = subject.Name
            };
        }

        public static readonly Expression<Func<Subject, SubjectReadDto>> ToDtoProjection =
            subject => new SubjectReadDto
            {
                Id = subject.Id,
                Name = subject.Name
            };
    }
}
