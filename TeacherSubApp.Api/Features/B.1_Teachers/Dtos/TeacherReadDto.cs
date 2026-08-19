using System.Linq.Expressions;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.Teachers.Dtos
{
    public sealed record TeacherReadDto(int Id, string Name, int? SubjectId, bool IsSupervisor, string? SubjectName)
    {
        public static TeacherReadDto FromEntity(Teacher t) =>
            new(t.Id, t.Name, t.SubjectId, t.IsSupervisor, t.Subject?.Name);

        public static readonly Expression<Func<Teacher, TeacherReadDto>> ToDtoProjection =
            t => new TeacherReadDto(t.Id, t.Name, t.SubjectId, t.IsSupervisor, t.Subject != null ? t.Subject.Name : null);
    }
}