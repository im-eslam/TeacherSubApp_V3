using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Features.EventKeys.Dtos;

namespace TeacherSubApp.Api.Features.EventKeys
{
    public interface IEventKeyService
    {
        // READ
        Task<Result<List<EventKeyReadDto>>> GetAllAsync(EventKeyQuery query);
        Task<Result<EventKeyReadDto>> GetByIdAsync(int id);

        // CREATE, UPDATE, DELETE
        Task<Result<EventKeyReadDto>> CreateAsync(EventKeyWriteDto dto);
        Task<Result<EventKeyReadDto>> UpdateAsync(int id, EventKeyWriteDto dto);
        Task<Result> DeleteAsync(int id);
    }
}