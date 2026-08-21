using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.WeeklySchedules.Dtos;
using TeacherSubApp.Api.Features.WeeklySchedules.Internal;

namespace TeacherSubApp.Api.Features.WeeklySchedules
{
    public class WeeklyScheduleService_draft
    {
        private readonly AppDbContext _db;
        private readonly SlotSwapperHandler _swapper;
        private readonly ScheduleBulkEditorHandler _bulkEditor;

        public WeeklyScheduleService(AppDbContext db, SlotSwapperHandler swapper, ScheduleBulkEditorHandler bulkEditor)
        {
            _db = db;
            _swapper = swapper;
            _bulkEditor = bulkEditor;
        }

        public async Task<Result<List<WeeklyScheduleReadDto>>> GetAllAsync(WeeklyScheduleQuery query)
        {
            List<WeeklyScheduleReadDto> schedules = await _FetchAllActiveAsync(query);
            return Result<List<WeeklyScheduleReadDto>>.Success(schedules);
        }

        public async Task<Result<WeeklyScheduleReadDto>> GetByIdAsync(int id)
        {
            WeeklySchedule? schedule = await FindActiveByIdWithIncludesAsync(id);

            return (schedule is null)
                ? Result<WeeklyScheduleReadDto>.Failure(ErrorType.NotFound, WeeklyScheduleErrors.NotFound)
                : Result<WeeklyScheduleReadDto>.Success(WeeklyScheduleReadDto.FromEntity(schedule));
        }

        public async Task<Result<WeeklyScheduleReadDto>> CreateAsync(WeeklyScheduleWriteDto dto)
        {
            return await CreateCoreAsync(dto);
        }

        public async Task<Result<WeeklyScheduleReadDto>> UpdateAsync(int id, WeeklyScheduleWriteDto dto)
        {
            return await UpdateCoreAsync(id, dto);
        }

        public async Task<Result> DeleteAsync(int id)
        {
            return await DeleteCoreAsync(id);
        }

        // Swap and BulkEdit are thin delegations — the actual algorithms live in
        // Internal/SlotSwapper and Internal/ScheduleBulkEditor, which call back
        // into this class's internal Core methods so there is a single code path
        // for create/update/delete regardless of caller.
        public Task<Result> SwapAsync(SlotCoordinate slotA, SlotCoordinate slotB)
        {
            return _swapper.SwapAsync(slotA, slotB);
        }

        public Task<Result> BulkEditAsync(WeeklyScheduleBulkEditRequest request)
        {
            return _bulkEditor.ExecuteAsync(request);
        }


        #region === Core Operations (internal: shared with SlotSwapper / ScheduleBulkEditor, transaction-agnostic) ===

        internal async Task<Result<WeeklyScheduleReadDto>> CreateCoreAsync(WeeklyScheduleWriteDto dto)
        {
            List<Func<Task<Result>>> rules =
            [
                () => CheckClassOrEventPresentAsync(dto.ClassId, dto.EventId),
                () => CheckTeacherActiveAsync(dto.TeacherId),
                () => CheckClassActiveAsync(dto.ClassId),
                () => CheckEventActiveAsync(dto.EventId)
            ];

            foreach (Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if (res.IsFailure)
                {
                    return Result<WeeklyScheduleReadDto>.Failure(res.ErrorType, res.Error);
                }
            }

            WeeklySchedule created = await PersistNewAsync(dto);
            return Result<WeeklyScheduleReadDto>.Success(WeeklyScheduleReadDto.FromEntity(created));
        }

        internal async Task<Result<WeeklyScheduleReadDto>> UpdateCoreAsync(int id, WeeklyScheduleWriteDto dto)
        {
            WeeklySchedule? schedule = await FindActiveByIdWithIncludesAsync(id);
            if (schedule is null)
            {
                return Result<WeeklyScheduleReadDto>.Failure(ErrorType.NotFound, WeeklyScheduleErrors.NotFound);
            }

            (bool teacherChanged, bool classChanged, bool eventChanged, bool dayPeriodChanged) = DetectChanges(schedule, dto);
            if (!teacherChanged && !classChanged && !eventChanged && !dayPeriodChanged)
            {
                return Result<WeeklyScheduleReadDto>.Success(WeeklyScheduleReadDto.FromEntity(schedule));
            }

            List<Func<Task<Result>>> rules = [];
            if (classChanged || eventChanged)
            {
                rules.Add(() => CheckClassOrEventPresentAsync(dto.ClassId, dto.EventId));
            }
            if (teacherChanged)
            {
                rules.Add(() => CheckTeacherActiveAsync(dto.TeacherId));
            }
            if (classChanged)
            {
                rules.Add(() => CheckClassActiveAsync(dto.ClassId));
            }
            if (eventChanged)
            {
                rules.Add(() => CheckEventActiveAsync(dto.EventId));
            }

            foreach (Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if (res.IsFailure)
                {
                    return Result<WeeklyScheduleReadDto>.Failure(res.ErrorType, res.Error);
                }
            }

            WeeklySchedule updated = await ApplyUpdateAsync(schedule, dto);
            return Result<WeeklyScheduleReadDto>.Success(WeeklyScheduleReadDto.FromEntity(updated));
        }

        internal async Task<Result> DeleteCoreAsync(int id)
        {
            WeeklySchedule? schedule = await FindActiveByIdAsync(id);
            if (schedule is null)
            {
                return Result.Failure(ErrorType.NotFound, WeeklyScheduleErrors.NotFound);
            }

            await SoftDeleteAsync(schedule);
            return Result.Success();
        }

        #endregion


        #region === Internal Helpers (also shared with SlotSwapper / ScheduleBulkEditor) ===

        internal Task<WeeklySchedule?> FindActiveByIdAsync(int id)
        {
            return _db.WeeklySchedules.FirstOrDefaultAsync(ws => ws.Id == id && ws.DeletedAt == null);
        }

        internal Task<WeeklySchedule?> FindActiveByIdWithIncludesAsync(int id)
        {
            return _db.WeeklySchedules
                .Include(ws => ws.Teacher)
                .Include(ws => ws.SchoolClass)
                .Include(ws => ws.EventKey)
                .FirstOrDefaultAsync(ws => ws.Id == id && ws.DeletedAt == null);
        }

        internal Task<WeeklySchedule?> FindActiveByCoordinateAsync(int teacherId, int dayOfWeek, int periodNumber)
        {
            return _db.WeeklySchedules.FirstOrDefaultAsync(ws =>
                ws.TeacherId == teacherId &&
                ws.DayOfWeek == dayOfWeek &&
                ws.PeriodNumber == periodNumber &&
                ws.DeletedAt == null);
        }

        internal Task<Result> CheckClassOrEventPresentAsync(int? classId, int? eventId)
        {
            bool hasContent = classId.HasValue || eventId.HasValue;

            return hasContent
                ? Task.FromResult(Result.Success())
                : Task.FromResult(Result.Failure(ErrorType.Validation, WeeklyScheduleErrors.ClassOrEventRequired));
        }

        internal async Task<Result> CheckTeacherActiveAsync(int teacherId)
        {
            bool teacherValid = await _db.Teachers.AnyAsync(t => t.Id == teacherId && t.DeletedAt == null);

            return teacherValid
                ? Result.Success()
                : Result.Failure(ErrorType.Validation, WeeklyScheduleErrors.TeacherInvalid);
        }

        internal async Task<Result> CheckClassActiveAsync(int? classId)
        {
            if (!classId.HasValue)
                return Result.Success();

            bool classValid = await _db.Classes.AnyAsync(c => c.Id == classId.Value && c.DeletedAt == null);

            return classValid
                ? Result.Success()
                : Result.Failure(ErrorType.Validation, WeeklyScheduleErrors.ClassInvalid);
        }

        internal async Task<Result> CheckEventActiveAsync(int? eventId)
        {
            if (!eventId.HasValue)
                return Result.Success();

            bool eventValid = await _db.EventKeys.AnyAsync(e => e.Id == eventId.Value && e.DeletedAt == null);

            return eventValid
                ? Result.Success()
                : Result.Failure(ErrorType.Validation, WeeklyScheduleErrors.EventInvalid);
        }

        internal async Task SoftDeleteAsync(WeeklySchedule schedule)
        {
            schedule.DeletedAt = DateTime.UtcNow;
            schedule.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        internal async Task<WeeklySchedule> CreateNewRowAsync(int teacherId, int dayOfWeek, int periodNumber, int? classId, int? eventId)
        {
            WeeklySchedule entity = new()
            {
                TeacherId = teacherId,
                DayOfWeek = dayOfWeek,
                PeriodNumber = periodNumber,
                ClassId = classId,
                EventId = eventId
            };

            _db.WeeklySchedules.Add(entity);
            await _db.SaveChangesAsync();
            await LoadNavigationsAsync(entity);

            return entity;
        }

        internal async Task ApplyContentInPlaceAsync(WeeklySchedule schedule, int? classId, int? eventId)
        {
            schedule.ClassId = classId;
            schedule.EventId = eventId;
            schedule.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
        }

        #endregion


        #region === Private Helpers (CRUD-only, not shared) ===

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

        private static (bool TeacherChanged, bool ClassChanged, bool EventChanged, bool DayPeriodChanged) DetectChanges(WeeklySchedule schedule, WeeklyScheduleWriteDto dto)
        {
            bool teacherChanged = schedule.TeacherId != dto.TeacherId;
            bool classChanged = schedule.ClassId != dto.ClassId;
            bool eventChanged = schedule.EventId != dto.EventId;
            bool dayPeriodChanged = schedule.DayOfWeek != dto.DayOfWeek || schedule.PeriodNumber != dto.PeriodNumber;

            return (teacherChanged, classChanged, eventChanged, dayPeriodChanged);
        }

        private async Task<WeeklySchedule> PersistNewAsync(WeeklyScheduleWriteDto dto)
        {
            WeeklySchedule entity = dto.ToEntity();
            _db.WeeklySchedules.Add(entity);

            await _db.SaveChangesAsync();

            await LoadNavigationsAsync(entity);

            return entity;
        }

        private async Task<WeeklySchedule> ApplyUpdateAsync(WeeklySchedule schedule, WeeklyScheduleWriteDto dto)
        {
            schedule.TeacherId = dto.TeacherId;
            schedule.DayOfWeek = dto.DayOfWeek;
            schedule.PeriodNumber = dto.PeriodNumber;
            schedule.ClassId = dto.ClassId;
            schedule.EventId = dto.EventId;

            schedule.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            await LoadNavigationsAsync(schedule);

            return schedule;
        }

        private async Task LoadNavigationsAsync(WeeklySchedule schedule)
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

        private Task<WeeklySchedule?> FindActiveByIdInternal(int id) => FindActiveByIdAsync(id);

        #endregion
    }
}