using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.WeeklySchedules.Dtos;
using TeacherSubApp.Api.Features.WeeklySchedules.Internal;

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

        public async Task<Result<WeeklyScheduleReadDto>> UpdateAsync(int id, WeeklyScheduleWriteDto dto)
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

        public async Task<Result> DeleteAsync(int id)
        {
            WeeklySchedule? schedule = await _FindActiveByIdAsync(id);
            if (schedule is null)
            {
                return Result.Failure(ErrorType.NotFound, WeeklyScheduleErrors.NotFound);
            }

            await _SoftDeleteAsync(schedule);
            return Result.Success();
        }

        public async Task<Result> SwapAsync(SlotCoordinate slotA, SlotCoordinate slotB)
        {
            await using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                SlotSwapperHandler swapper = new SlotSwapperHandler(_db);
                Result result = await swapper.SwapCoreAsync(slotA, slotB);

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
                ScheduleBulkEditorHandler editor = new ScheduleBulkEditorHandler(_db);
                Result result = await editor.ExecuteCoreAsync(request);

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

        #region === Helpers ===

        // Read
        protected async Task<List<WeeklyScheduleReadDto>> _FetchAllActiveAsync(WeeklyScheduleQuery query)
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

        protected Task<WeeklySchedule?> _FindActiveByIdAsync(int id)
        {
            return _db.WeeklySchedules.FirstOrDefaultAsync(ws => ws.Id == id && ws.DeletedAt == null);
        }

        protected Task<WeeklySchedule?> _FindActiveByIdWithIncludesAsync(int id)
        {
            return _db.WeeklySchedules
                .Include(ws => ws.Teacher)
                    .ThenInclude(t => t.Subject)
                .Include(ws => ws.SchoolClass)
                .Include(ws => ws.EventKey)
                .FirstOrDefaultAsync(ws => ws.Id == id && ws.DeletedAt == null);
        }

        // Validation
        protected Task<Result> _CheckClassOrEventPresentAsync(int? classId, int? eventId)
        {
            bool hasContent = classId.HasValue || eventId.HasValue;

            return hasContent
                ? Task.FromResult(Result.Success())
                : Task.FromResult(Result.Failure(ErrorType.Validation, WeeklyScheduleErrors.ClassOrEventRequired));
        }

        protected async Task<Result> _CheckTeacherActiveAsync(int teacherId)
        {
            bool teacherValid = await _db.Teachers.AnyAsync(t => t.Id == teacherId && t.DeletedAt == null);

            return teacherValid
                ? Result.Success()
                : Result.Failure(ErrorType.Validation, WeeklyScheduleErrors.TeacherInvalid);
        }

        protected async Task<Result> _CheckClassActiveAsync(int? classId)
        {
            if (!classId.HasValue)
                return Result.Success();

            bool classValid = await _db.Classes.AnyAsync(c => c.Id == classId.Value && c.DeletedAt == null);

            return classValid
                ? Result.Success()
                : Result.Failure(ErrorType.Validation, WeeklyScheduleErrors.ClassInvalid);
        }

        protected async Task<Result> _CheckEventActiveAsync(int? eventId)
        {
            if (!eventId.HasValue)
                return Result.Success();

            bool eventValid = await _db.EventKeys.AnyAsync(e => e.Id == eventId.Value && e.DeletedAt == null);

            return eventValid
                ? Result.Success()
                : Result.Failure(ErrorType.Validation, WeeklyScheduleErrors.EventInvalid);
        }

        // State
        protected static (bool TeacherChanged, bool ClassChanged, bool EventChanged, bool DayPeriodChanged) _DetectChanges(WeeklySchedule schedule, WeeklyScheduleWriteDto dto)
        {
            bool teacherChanged = schedule.TeacherId != dto.TeacherId;
            bool classChanged = schedule.ClassId != dto.ClassId;
            bool eventChanged = schedule.EventId != dto.EventId;
            bool dayPeriodChanged = schedule.DayOfWeek != dto.DayOfWeek || schedule.PeriodNumber != dto.PeriodNumber;

            return (teacherChanged, classChanged, eventChanged, dayPeriodChanged);
        }

        // Create / Update
        protected async Task<WeeklySchedule> _PersistNewAsync(WeeklyScheduleWriteDto dto)
        {
            WeeklySchedule entity = dto.ToEntity();
            _db.WeeklySchedules.Add(entity);
            await _db.SaveChangesAsync();
            await _LoadNavigationsAsync(entity);
            return entity;
        }

        protected async Task<WeeklySchedule> _ApplyUpdateAsync(WeeklySchedule schedule, WeeklyScheduleWriteDto dto)
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

        protected async Task _LoadNavigationsAsync(WeeklySchedule schedule)
        {
            _db.Entry(schedule).State = EntityState.Detached;

            if (schedule.Teacher == null || schedule.Teacher.Id != schedule.TeacherId)
            {
                schedule.Teacher = (await _db.Teachers
                    .Include(t => t.Subject)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Id == schedule.TeacherId))!;
            }

            if (!schedule.ClassId.HasValue)
            {
                schedule.SchoolClass = null;
            }
            else if (schedule.SchoolClass == null || schedule.SchoolClass.Id != schedule.ClassId.Value)
            {
                schedule.SchoolClass = await _db.Classes
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Id == schedule.ClassId.Value);
            }

            if (!schedule.EventId.HasValue)
            {
                schedule.EventKey = null;
            }
            else if (schedule.EventKey == null || schedule.EventKey.Id != schedule.EventId.Value)
            {
                schedule.EventKey = await _db.EventKeys
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.Id == schedule.EventId.Value);
            }
        }

        // Delete
        protected async Task _SoftDeleteAsync(WeeklySchedule schedule)
        {
            schedule.DeletedAt = DateTime.UtcNow;
            schedule.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        #endregion
    }
}