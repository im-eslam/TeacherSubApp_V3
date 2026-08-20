using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Features.TeacherAbsences.Dtos;

namespace TeacherSubApp.Api.Features.TeacherAbsences
{
    public interface ITeacherAbsenceService
    {
        // READ
        Task<Result<List<TeacherAbsenceReadDto>>> GetAllAsync(TeacherAbsenceQuery query);
        Task<Result<TeacherAbsenceReadDto>> GetByIdAsync(int id);

        // CREATE, UPDATE, DELETE
        Task<Result<TeacherAbsenceReadDto>> CreateAsync(TeacherAbsenceWriteDto dto);
        Task<Result<TeacherAbsenceReadDto>> UpdateAsync(int id, TeacherAbsenceWriteDto dto);
        Task<Result> DeleteAsync(int id);
    }
}
