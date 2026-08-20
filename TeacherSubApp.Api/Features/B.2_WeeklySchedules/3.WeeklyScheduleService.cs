using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.WeeklySchedules.Dtos;

namespace TeacherSubApp.Api.Features.WeeklySchedules
{
    public class WeeklyScheduleService : IWeeklyScheduleService
    {
        private readonly AppDbContext _db;
        public WeeklyScheduleService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Result<List<WeeklyScheduleReadDto>>> GetAllAsync(WeeklyScheduleQuery query)
        {
            List<WeeklyScheduleReadDto> schedules = await _FetchAllActiveAsync(query);
            return Result<List<WeeklyScheduleReadDto>>.Success(schedules);
        }

        public async Task<Result<WeeklyScheduleReadDto>> GetByIdAsync(int id)
        {
            WeeklySchedule? schedule = await _FindActiveByIdWithIncludesAsync(id);

            return (schedule is null)
                ? Result<WeeklyScheduleReadDto>.Failure(ErrorType.NotFound, WeeklyScheduleErrors.NotFound)
                : Result<WeeklyScheduleReadDto>.Success(WeeklyScheduleReadDto.FromEntity(schedule));
        }

        public async Task<Result<WeeklyScheduleReadDto>> CreateAsync(WeeklyScheduleWriteDto dto)
        {
            return await _CreateCoreAsync(dto);
        }

        public async Task<Result<WeeklyScheduleReadDto>> UpdateAsync(int id, WeeklyScheduleWriteDto dto)
        {
            return await _UpdateCoreAsync(id, dto);
        }

        public async Task<Result> DeleteAsync(int id)
        {
            return await _DeleteCoreAsync(id);
        }

        public async Task<Result> SwapAsync(SlotCoordinate cordA, SlotCoordinate cordB)
        {
            await using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                Result result = await _SwapCoreAsync(cordA, cordB);
                if (result.IsFailure)
                {
                    await transaction.RollbackAsync();
                    return result;
                }

                await transaction.CommitAsync();
                return Result.Success();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<Result> BulkEditAsync(WeeklyScheduleBulkEditRequest request)
        {
            if (!request.HasAnyOperations)
            {
                return Result.Failure(ErrorType.Validation, WeeklyScheduleErrors.BulkOperationInvalid);
            }

            await using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                foreach (int id in request.Deletes)
                {
                    Result result = await _DeleteCoreAsync(id);
                    if (result.IsFailure)
                    {
                        await transaction.RollbackAsync();
                        return result;
                    }
                }

                foreach (WeeklyScheduleUpdateEntry entry in request.Updates)
                {
                    Result<WeeklyScheduleReadDto> result = await _UpdateCoreAsync(entry.Id, entry.Payload);
                    if (result.IsFailure)
                    {
                        await transaction.RollbackAsync();
                        return Result.Failure(result.ErrorType, result.Error);
                    }
                }

                foreach (WeeklyScheduleSwapEntry entry in request.Swaps)
                {
                    Result result = await _SwapCoreAsync(entry.SlotA, entry.SlotB);
                    if (result.IsFailure)
                    {
                        await transaction.RollbackAsync();
                        return result;
                    }
                }

                foreach (WeeklyScheduleWriteDto dto in request.Creates)
                {
                    Result<WeeklyScheduleReadDto> result = await _CreateCoreAsync(dto);
                    if (result.IsFailure)
                    {
                        await transaction.RollbackAsync();
                        return Result.Failure(result.ErrorType, result.Error);
                    }
                }

                await transaction.CommitAsync();
                return Result.Success();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }


        #region === Core Operations (transaction-agnostic) ===

        private async Task<Result<WeeklyScheduleReadDto>> _CreateCoreAsync(WeeklyScheduleWriteDto dto)
        {
            List<Func<Task<Result>>> rules =
            [
                () => _CheckClassOrEventPresentAsync(dto.ClassId, dto.EventId),
                () => _CheckTeacherActiveAsync(dto.TeacherId),
                () => _CheckClassActiveAsync(dto.ClassId),
                () => _CheckEventActiveAsync(dto.EventId)
            ];

            foreach (Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if (res.IsFailure)
                {
                    return Result<WeeklyScheduleReadDto>.Failure(res.ErrorType, res.Error);
                }
            }

            WeeklySchedule created = await _PersistNewAsync(dto);
            return Result<WeeklyScheduleReadDto>.Success(WeeklyScheduleReadDto.FromEntity(created));
        }

        private async Task<Result<WeeklyScheduleReadDto>> _UpdateCoreAsync(int id, WeeklyScheduleWriteDto dto)
        {
            WeeklySchedule? schedule = await _FindActiveByIdWithIncludesAsync(id);
            if (schedule is null)
            {
                return Result<WeeklyScheduleReadDto>.Failure(ErrorType.NotFound, WeeklyScheduleErrors.NotFound);
            }

            (bool teacherChanged, bool classChanged, bool eventChanged, bool dayPeriodChanged) = _DetectChanges(schedule, dto);
            if (!teacherChanged && !classChanged && !eventChanged && !dayPeriodChanged)
            {
                return Result<WeeklyScheduleReadDto>.Success(WeeklyScheduleReadDto.FromEntity(schedule));
            }

            List<Func<Task<Result>>> rules = [];
            if (classChanged || eventChanged)
            {
                rules.Add(() => _CheckClassOrEventPresentAsync(dto.ClassId, dto.EventId));
            }
            if (teacherChanged)
            {
                rules.Add(() => _CheckTeacherActiveAsync(dto.TeacherId));
            }
            if (classChanged)
            {
                rules.Add(() => _CheckClassActiveAsync(dto.ClassId));
            }
            if (eventChanged)
            {
                rules.Add(() => _CheckEventActiveAsync(dto.EventId));
            }

            foreach (Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if (res.IsFailure)
                {
                    return Result<WeeklyScheduleReadDto>.Failure(res.ErrorType, res.Error);
                }
            }

            WeeklySchedule updated = await _ApplyUpdateAsync(schedule, dto);
            return Result<WeeklyScheduleReadDto>.Success(WeeklyScheduleReadDto.FromEntity(updated));
        }

        private async Task<Result> _DeleteCoreAsync(int id)
        {
            WeeklySchedule? schedule = await _FindActiveByIdAsync(id);
            if (schedule is null)
            {
                return Result.Failure(ErrorType.NotFound, WeeklyScheduleErrors.NotFound);
            }

            await _SoftDeleteAsync(schedule);
            return Result.Success();
        }

        private async Task<Result> _SwapCoreAsync(SlotCoordinate cordA, SlotCoordinate cordB)
        {
            bool sameSlot = cordA.TeacherId == cordB.TeacherId && cordA.DayOfWeek == cordB.DayOfWeek && cordA.PeriodNumber == cordB.PeriodNumber;
            if (sameSlot)
            {
                return Result.Success();
            }

            WeeklySchedule? slotA = await _FindActiveByCoordinateAsync(cordA.TeacherId, cordA.DayOfWeek, cordA.PeriodNumber);
            WeeklySchedule? slotB = await _FindActiveByCoordinateAsync(cordB.TeacherId, cordB.DayOfWeek, cordB.PeriodNumber);

            (int? classId, int? eventId) contentA = slotA is not null ? (slotA.ClassId, slotA.EventId) : (null, null);
            (int? classId, int? eventId) contentB = slotB is not null ? (slotB.ClassId, slotB.EventId) : (null, null);

            Result applyToA = await _ApplyContentToSlotAsync(slotA, cordA, contentB.classId, contentB.eventId);
            if (applyToA.IsFailure)
                return applyToA;

            Result applyToB = await _ApplyContentToSlotAsync(slotB, cordB, contentA.classId, contentA.eventId);
            if (applyToB.IsFailure)
                return applyToB;

            return Result.Success();
        }

        #endregion


        #region === Helper Methods ===

        // Read
        private async Task<List<WeeklyScheduleReadDto>> _FetchAllActiveAsync(WeeklyScheduleQuery query)
        {
            IQueryable<WeeklySchedule> q = _db.WeeklySchedules.AsNoTracking().Where(ws => ws.DeletedAt == null);

            if (query.TeacherId.HasValue)
                q = q.Where(ws => ws.TeacherId == query.TeacherId.Value);

            if (query.ClassId.HasValue)
                q = q.Where(ws => ws.ClassId == query.ClassId.Value);

            if (query.EventId.HasValue)
                q = q.Where(ws => ws.EventId == query.EventId.Value);

            if (query.DayOfWeek.HasValue)
                q = q.Where(ws => ws.DayOfWeek == query.DayOfWeek.Value);

            if (query.PeriodNumber.HasValue)
                q = q.Where(ws => ws.PeriodNumber == query.PeriodNumber.Value);

            return await q.OrderBy(ws => ws.TeacherId)
                          .ThenBy(ws => ws.DayOfWeek)
                          .ThenBy(ws => ws.PeriodNumber)
                          .Select(WeeklyScheduleReadDto.ToDtoProjection)
                          .ToListAsync();
        }

        private Task<WeeklySchedule?> _FindActiveByIdAsync(int id)
        {
            return _db.WeeklySchedules.FirstOrDefaultAsync(ws => ws.Id == id && ws.DeletedAt == null);
        }

        private Task<WeeklySchedule?> _FindActiveByIdWithIncludesAsync(int id)
        {
            return _db.WeeklySchedules
                .Include(ws => ws.Teacher)
                .Include(ws => ws.SchoolClass)
                .Include(ws => ws.EventKey)
                .FirstOrDefaultAsync(ws => ws.Id == id && ws.DeletedAt == null);
        }

        private Task<WeeklySchedule?> _FindActiveByCoordinateAsync(int teacherId, int dayOfWeek, int periodNumber)
        {
            return _db.WeeklySchedules.FirstOrDefaultAsync(ws =>
                ws.TeacherId == teacherId &&
                ws.DayOfWeek == dayOfWeek &&
                ws.PeriodNumber == periodNumber &&
                ws.DeletedAt == null);
        }

        // Validation
        private Task<Result> _CheckClassOrEventPresentAsync(int? classId, int? eventId)
        {
            bool hasContent = classId.HasValue || eventId.HasValue;

            return hasContent
                ? Task.FromResult(Result.Success())
                : Task.FromResult(Result.Failure(ErrorType.Validation, WeeklyScheduleErrors.ClassOrEventRequired));
        }

        private async Task<Result> _CheckTeacherActiveAsync(int teacherId)
        {
            bool teacherValid = await _db.Teachers.AnyAsync(t => t.Id == teacherId && t.DeletedAt == null);

            return teacherValid
                ? Result.Success()
                : Result.Failure(ErrorType.Validation, WeeklyScheduleErrors.TeacherInvalid);
        }

        private async Task<Result> _CheckClassActiveAsync(int? classId)
        {
            if (!classId.HasValue)
                return Result.Success();

            bool classValid = await _db.Classes.AnyAsync(c => c.Id == classId.Value && c.DeletedAt == null);

            return classValid
                ? Result.Success()
                : Result.Failure(ErrorType.Validation, WeeklyScheduleErrors.ClassInvalid);
        }

        private async Task<Result> _CheckEventActiveAsync(int? eventId)
        {
            if (!eventId.HasValue)
                return Result.Success();

            bool eventValid = await _db.EventKeys.AnyAsync(e => e.Id == eventId.Value && e.DeletedAt == null);

            return eventValid
                ? Result.Success()
                : Result.Failure(ErrorType.Validation, WeeklyScheduleErrors.EventInvalid);
        }

        // State
        private static (bool TeacherChanged, bool ClassChanged, bool EventChanged, bool DayPeriodChanged) _DetectChanges(WeeklySchedule schedule, WeeklyScheduleWriteDto dto)
        {
            bool teacherChanged = schedule.TeacherId != dto.TeacherId;
            bool classChanged = schedule.ClassId != dto.ClassId;
            bool eventChanged = schedule.EventId != dto.EventId;
            bool dayPeriodChanged = schedule.DayOfWeek != dto.DayOfWeek || schedule.PeriodNumber != dto.PeriodNumber;

            return (teacherChanged, classChanged, eventChanged, dayPeriodChanged);
        }

        // Create / Update
        private async Task<WeeklySchedule> _PersistNewAsync(WeeklyScheduleWriteDto dto)
        {
            WeeklySchedule entity = dto.ToEntity();
            _db.WeeklySchedules.Add(entity);

            await _db.SaveChangesAsync();

            await _LoadNavigationsAsync(entity);

            return entity;
        }

        private async Task<WeeklySchedule> _ApplyUpdateAsync(WeeklySchedule schedule, WeeklyScheduleWriteDto dto)
        {
            schedule.TeacherId = dto.TeacherId;
            schedule.DayOfWeek = dto.DayOfWeek;
            schedule.PeriodNumber = dto.PeriodNumber;
            schedule.ClassId = dto.ClassId;
            schedule.EventId = dto.EventId;

            schedule.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            await _LoadNavigationsAsync(schedule);

            return schedule;
        }

        private async Task _LoadNavigationsAsync(WeeklySchedule schedule)
        {
            if (schedule.Teacher == null || schedule.Teacher.Id != schedule.TeacherId)
            {
                schedule.Teacher = (await _db.Teachers
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Id == schedule.TeacherId))!;
            }

            if (schedule.ClassId.HasValue && (schedule.SchoolClass == null || schedule.SchoolClass.Id != schedule.ClassId))
            {
                schedule.SchoolClass = await _db.Classes
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Id == schedule.ClassId.Value);
            }
            else if (!schedule.ClassId.HasValue)
            {
                schedule.SchoolClass = null;
            }

            if (schedule.EventId.HasValue && (schedule.EventKey == null || schedule.EventKey.Id != schedule.EventId))
            {
                schedule.EventKey = await _db.EventKeys
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.Id == schedule.EventId.Value);
            }
            else if (!schedule.EventId.HasValue)
            {
                schedule.EventKey = null;
            }
        }

        // Delete
        private async Task _SoftDeleteAsync(WeeklySchedule schedule)
        {
            schedule.DeletedAt = DateTime.UtcNow;
            schedule.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        // Swap
        private async Task<Result> _ApplyContentToSlotAsync(WeeklySchedule? existingSlot, SlotCoordinate coord, int? classId, int? eventId)
        {
            bool hasNewContent = classId.HasValue || eventId.HasValue;

            // existing slot present, new content empty -> soft-delete the row
            if (existingSlot is not null && !hasNewContent)
            {
                await _SoftDeleteAsync(existingSlot);
                return Result.Success();
            }

            // existing slot present, new content non-empty -> update the row's content in place
            if (existingSlot is not null && hasNewContent)
            {
                Result classCheck = await _CheckClassActiveAsync(classId);
                if (classCheck.IsFailure)
                    return classCheck;

                Result eventCheck = await _CheckEventActiveAsync(eventId);
                if (eventCheck.IsFailure)
                    return eventCheck;

                existingSlot.ClassId = classId;
                existingSlot.EventId = eventId;
                existingSlot.UpdatedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();
                return Result.Success();
            }

            // existing slot absent, new content non empty -> create a new row at coord
            if (existingSlot is null && hasNewContent)
            {
                Result teacherCheck = await _CheckTeacherActiveAsync(coord.TeacherId);
                if (teacherCheck.IsFailure)
                    return teacherCheck;

                Result classCheck = await _CheckClassActiveAsync(classId);
                if (classCheck.IsFailure)
                    return classCheck;

                Result eventCheck = await _CheckEventActiveAsync(eventId);
                if (eventCheck.IsFailure)
                    return eventCheck;

                WeeklySchedule newRow = new()
                {
                    TeacherId = coord.TeacherId,
                    DayOfWeek = coord.DayOfWeek,
                    PeriodNumber = coord.PeriodNumber,
                    ClassId = classId,
                    EventId = eventId
                };

                _db.WeeklySchedules.Add(newRow);
                await _db.SaveChangesAsync();
                return Result.Success();
            }

            // existing slot is null and no new content -> nothing to do
            return Result.Success();
        }

        #endregion
    }
}