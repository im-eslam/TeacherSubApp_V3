using System.Linq.Expressions;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.Teachers.Dtos
{
    public record TeacherReadDto
    {
        public int Id { get; init; }
        public string Name { get; init; } = string.Empty;
        public int? SubjectId { get; init; }
        public bool IsSupervisor { get; init; }
        public string? SubjectName { get; init; }

        public static TeacherReadDto FromEntity(Teacher teacher)
        {
            return new TeacherReadDto
            {
                Id = teacher.Id,
                Name = teacher.Name,
                SubjectId = teacher.SubjectId,
                SubjectName = teacher.Subject?.Name,
                IsSupervisor = teacher.IsSupervisor
            };
        }

        public static readonly Expression<Func<Teacher, TeacherReadDto>> ToDtoProjection =
            t => new TeacherReadDto
            {
                Id = t.Id,
                Name = t.Name,
                SubjectId = t.SubjectId,
                SubjectName = t.Subject != null ? t.Subject.Name : null,
                IsSupervisor = t.IsSupervisor
            };
    }
}