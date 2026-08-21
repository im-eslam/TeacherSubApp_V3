using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.WeeklySchedules.Dtos;

namespace TeacherSubApp.Api.Features.WeeklySchedules.Internal
{
    public sealed class ScheduleBulkEditorHandler : WeeklyScheduleService
    {
        private readonly AppDbContext _db;
        private readonly SlotSwapperHandler _swapper;

        public ScheduleBulkEditorHandler(AppDbContext db) : base(db)
        {
            _db = db;
            _swapper = new SlotSwapperHandler(db);
        }

        public async Task<Result> ExecuteCoreAsync(WeeklyScheduleBulkEditRequest request)
        {
            foreach (int id in request.Deletes)
            {
                WeeklySchedule? schedule = await _FindActiveByIdAsync(id);
                if (schedule is null)
                    return Result.Failure(ErrorType.NotFound, WeeklyScheduleErrors.NotFound);

                await _SoftDeleteAsync(schedule);
            }

            foreach (WeeklyScheduleUpdateEntry entry in request.Updates)
            {
                WeeklySchedule? schedule = await _FindActiveByIdAsync(entry.Id);
                if (schedule is null)
                    return Result.Failure(ErrorType.NotFound, WeeklyScheduleErrors.NotFound);

                List<Func<Task<Result>>> updateRules =
                [
                    () => _CheckClassOrEventPresentAsync(entry.Payload.ClassId, entry.Payload.EventId),
                    () => _CheckTeacherActiveAsync(entry.Payload.TeacherId),
                    () => _CheckClassActiveAsync(entry.Payload.ClassId),
                    () => _CheckEventActiveAsync(entry.Payload.EventId)
                ];

                foreach (Func<Task<Result>> rule in updateRules)
                {
                    Result res = await rule();
                    if (res.IsFailure)
                        return res;
                }

                await _ApplyUpdateAsync(schedule, entry.Payload);
            }

            foreach (WeeklyScheduleSwapEntry entry in request.Swaps)
            {
                Result res = await _swapper.SwapCoreAsync(entry.SlotA, entry.SlotB);
                if (res.IsFailure)
                    return res;
            }

            foreach (WeeklyScheduleWriteDto dto in request.Creates)
            {
                List<Func<Task<Result>>> createRules =
                [
                    () => _CheckClassOrEventPresentAsync(dto.ClassId, dto.EventId),
                    () => _CheckTeacherActiveAsync(dto.TeacherId),
                    () => _CheckClassActiveAsync(dto.ClassId),
                    () => _CheckEventActiveAsync(dto.EventId)
                ];

                foreach (Func<Task<Result>> rule in createRules)
                {
                    Result res = await rule();
                    if (res.IsFailure)
                        return res;
                }

                await _PersistNewAsync(dto);
            }

            return Result.Success();
        }
    }
}