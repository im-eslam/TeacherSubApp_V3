using System.Linq.Expressions;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.TeacherAbsences.Dtos
{
    public sealed record TeacherAbsenceReadDto(
        int Id,
        int TeacherId,
        string TeacherName,
        DateOnly AbsenceDate,
        string? Reason)
    {
        public static TeacherAbsenceReadDto FromEntity(TeacherAbsence absence) =>
            new(absence.Id, absence.TeacherId, absence.Teacher.Name, absence.AbsenceDate, absence.Reason);

        public static readonly Expression<Func<TeacherAbsence, TeacherAbsenceReadDto>> ToDtoProjection =
            absence => new TeacherAbsenceReadDto(
                absence.Id,
                absence.TeacherId,
                absence.Teacher != null ? absence.Teacher.Name : string.Empty,
                absence.AbsenceDate,
                absence.Reason);
    }
}
