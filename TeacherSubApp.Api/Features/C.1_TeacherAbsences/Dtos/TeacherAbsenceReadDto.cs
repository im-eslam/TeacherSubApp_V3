using System.Linq.Expressions;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.TeacherAbsences.Dtos
{
    public sealed record TeacherAbsenceReadDto(int Id, int TeacherId, string TeacherName, DateOnly AbsenceDate, string? Reason)
    {
        public static TeacherAbsenceReadDto FromEntity(TeacherAbsence absence) =>
            new(absence.Id, absence.TeacherId, absence.Teacher.Name, absence.AbsenceDate, absence.Reason);

        public static readonly Expression<Func<TeacherAbsence, TeacherAbsenceReadDto>> ToDtoProjection = b =>
            new TeacherAbsenceReadDto(
                b.Id,
                b.TeacherId,
                b.Teacher != null ? b.Teacher.Name : string.Empty,
                b.AbsenceDate,
                b.Reason
            );
    }
}
