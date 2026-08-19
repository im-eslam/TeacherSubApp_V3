using System.Linq.Expressions;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.Subjects.Dtos
{
    public sealed record SubjectReadDto (int Id, string Name)
    {
        public static SubjectReadDto FromEntity (Subject s) =>
            new(s.Id, s.Name);

        public static readonly Expression<Func<Subject, SubjectReadDto>> ToDtoProjection =
            s => new SubjectReadDto(s.Id, s.Name);
    }
}
