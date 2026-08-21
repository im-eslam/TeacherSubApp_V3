using System.Linq.Expressions;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.Teachers.Dtos
{
    public sealed record TeacherReadDto(int Id, string Name, int? SubjectId, string? SubjectName, bool IsSupervisor)
    {
        public static TeacherReadDto FromEntity(Teacher t) =>
            new(t.Id, t.Name, t.SubjectId, t.Subject?.Name, t.IsSupervisor);

        public static readonly Expression<Func<Teacher, TeacherReadDto>> ToDtoProjection = t =>
            new TeacherReadDto(t.Id, t.Name, t.SubjectId, t.Subject != null ? t.Subject.Name : null, t.IsSupervisor);
    }
}