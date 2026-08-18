using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Features.Teachers.Dtos;

namespace TeacherSubApp.Api.Features.Teachers
{
    public interface ITeacherService
    {
        // READ
        Task<Result<List<TeacherReadDto>>> GetAllAsync(TeacherQuery query);
        Task<Result<TeacherReadDto>> GetByIdAsync(int id);

        // CREATE, UPDATE, DELETE
        Task<Result<TeacherReadDto>> CreateAsync(TeacherWriteDto dto);
        Task<Result<TeacherReadDto>> UpdateAsync(int id, TeacherWriteDto dto);
        Task<Result> DeleteAsync(int id);
    }
}