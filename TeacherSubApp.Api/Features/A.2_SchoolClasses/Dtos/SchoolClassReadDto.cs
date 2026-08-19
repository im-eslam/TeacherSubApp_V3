using System.Linq.Expressions;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.SchoolClasses.Dtos
{
    public sealed record SchoolClassReadDto(int Id, int? Grade, int? Section, string DisplayName)
    {
        public static SchoolClassReadDto FromEntity(SchoolClass c) =>
            new(c.Id, c.Grade, c.Section, c.DisplayName);

        public static readonly Expression<Func<SchoolClass, SchoolClassReadDto>> ToDtoProjection =
            c => new SchoolClassReadDto(c.Id, c.Grade, c.Section, c.DisplayName);
    }
}