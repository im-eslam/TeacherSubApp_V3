using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Features.Subjects.Dtos;

namespace TeacherSubApp.Api.Features.Subjects
{
    public interface ISubjectService
    {
        // READ
        Task<Result<List<SubjectReadDto>>> GetAllAsync(SubjectQuery query);
        Task<Result<SubjectReadDto>> GetByIdAsync(int id);

        // CREATE, UPDATE, DELETE
        Task<Result<SubjectReadDto>> CreateAsync(SubjectWriteDto dto);
        Task<Result<SubjectReadDto>> UpdateAsync(int id, SubjectWriteDto dto);
        Task<Result> DeleteAsync(int id);
    }
}
