using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Common.Results;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.WeeklySchedules.Dtos;

namespace TeacherSubApp.Api.Features.WeeklySchedules
{
    public sealed class WeeklyScheduleService : IWeeklyScheduleService
    {
        private readonly AppDbContext _db;

        public WeeklyScheduleService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Result<List<WeeklyScheduleReadDto>>> GetAllAsync(WeeklyScheduleQuery query)
        {
            IQueryable<WeeklySchedule> schedules = _db.WeeklySchedules
                .AsNoTracking()
                .Where(ws => ws.DeletedAt == null);

            if (query.TeacherId.HasValue)
                schedules = schedules.Where(ws => ws.TeacherId == query.TeacherId.Value);

            if (query.DayOfWeek.HasValue)
                schedules = schedules.Where(ws => ws.DayOfWeek == query.DayOfWeek.Value);

            if (query.PeriodNumber.HasValue)
                schedules = schedules.Where(ws => ws.PeriodNumber == query.PeriodNumber.Value);

            if (query.ClassId.HasValue)
                schedules = schedules.Where(ws => ws.ClassId == query.ClassId.Value);

            if (query.EventId.HasValue)
                schedules = schedules.Where(ws => ws.EventId == query.EventId.Value);

            List<WeeklyScheduleReadDto> result = await schedules
                .OrderBy(ws => ws.DayOfWeek)
                .ThenBy(ws => ws.PeriodNumber)
                .ThenBy(ws => ws.Id)
                .Select(WeeklyScheduleReadDto.ToDtoProjection)
                .ToListAsync();

            return Result<List<WeeklyScheduleReadDto>>.Success(result);
        }

        public async Task<Result<WeeklyScheduleReadDto>> GetByIdAsync(int id)
        {
            WeeklyScheduleReadDto? schedule = await _db.WeeklySchedules
                .AsNoTracking()
                .Where(ws => ws.Id == id && ws.DeletedAt == null)
                .Select(WeeklyScheduleReadDto.ToDtoProjection)
                .FirstOrDefaultAsync();

            return schedule is null
                ? _Failure<WeeklyScheduleReadDto>(Result.Failure(ErrorType.NotFound, WeeklyScheduleErrors.NotFound))
                : Result<WeeklyScheduleReadDto>.Success(schedule);
        }

        public async Task<Result<WeeklyScheduleReadDto>> CreateAsync(WeeklyScheduleWriteDto dto)
        {
            Result validation = _ValidateShape(dto);
            if (validation.IsFailure)
                return _Failure<WeeklyScheduleReadDto>(validation);

            validation = await _ValidateReferencesAsync(dto);
            if (validation.IsFailure)
                return _Failure<WeeklyScheduleReadDto>(validation);

            validation = await _ValidateSlotConflictsAsync(dto, excludeIds: null);
            if (validation.IsFailure)
                return _Failure<WeeklyScheduleReadDto>(validation);

            WeeklySchedule entity = dto.ToEntity();
            _db.WeeklySchedules.Add(entity);
            await _db.SaveChangesAsync();

            WeeklyScheduleReadDto result = await _db.WeeklySchedules
                .AsNoTracking()
                .Where(ws => ws.Id == entity.Id)
                .Select(WeeklyScheduleReadDto.ToDtoProjection)
                .SingleAsync();

            return Result<WeeklyScheduleReadDto>.Success(result);
        }

        public async Task<Result<WeeklyScheduleReadDto>> UpdateAsync(int id, WeeklyScheduleWriteDto dto)
        {
            WeeklySchedule? entity = await _db.WeeklySchedules
                .FirstOrDefaultAsync(ws => ws.Id == id && ws.DeletedAt == null);

            if (entity is null)
                return _Failure<WeeklyScheduleReadDto>(Result.Failure(ErrorType.NotFound, WeeklyScheduleErrors.NotFound));

            Result validation = _ValidateShape(dto);
            if (validation.IsFailure)
                return _Failure<WeeklyScheduleReadDto>(validation);

            validation = await _ValidateReferencesAsync(dto);
            if (validation.IsFailure)
                return _Failure<WeeklyScheduleReadDto>(validation);

            validation = await _ValidateSlotConflictsAsync(dto, new[] { id });
            if (validation.IsFailure)
                return _Failure<WeeklyScheduleReadDto>(validation);

            _Apply(entity, dto);
            await _db.SaveChangesAsync();

            return Result<WeeklyScheduleReadDto>.Success(WeeklyScheduleReadDto.FromEntity(entity));
        }

        public async Task<Result> DeleteAsync(int id)
        {
            WeeklySchedule? entity = await _db.WeeklySchedules
                .FirstOrDefaultAsync(ws => ws.Id == id && ws.DeletedAt == null);

            if (entity is null)
                return Result.Failure(ErrorType.NotFound, WeeklyScheduleErrors.NotFound);

            DateTime now = DateTime.UtcNow;
            entity.DeletedAt = now;
            entity.UpdatedAt = now;
            await _db.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result<List<WeeklyScheduleReadDto>>> CreateBulkAsync(IEnumerable<WeeklyScheduleWriteDto> dtos)
        {
            List<WeeklyScheduleWriteDto> items = dtos.ToList();
            if (items.Count == 0)
                return _Failure<List<WeeklyScheduleReadDto>>(_ValidationFailure(WeeklyScheduleErrors.Validation.BulkItemsRequired));

            Result validation = _ValidateDuplicateSlots(items);
            if (validation.IsFailure)
                return _Failure<List<WeeklyScheduleReadDto>>(validation);

            await using var transaction = await _db.Database.BeginTransactionAsync();

            foreach (WeeklyScheduleWriteDto dto in items)
            {
                validation = _ValidateShape(dto);
                if (validation.IsFailure)
                    return _Failure<List<WeeklyScheduleReadDto>>(validation);

                validation = await _ValidateReferencesAsync(dto);
                if (validation.IsFailure)
                    return _Failure<List<WeeklyScheduleReadDto>>(validation);

                validation = await _ValidateSlotConflictsAsync(dto, excludeIds: null);
                if (validation.IsFailure)
                    return _Failure<List<WeeklyScheduleReadDto>>(validation);
            }

            List<WeeklySchedule> entities = items.Select(dto => dto.ToEntity()).ToList();
            _db.WeeklySchedules.AddRange(entities);
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            List<int> ids = entities.Select(entity => entity.Id).ToList();
            List<WeeklyScheduleReadDto> result = await _db.WeeklySchedules
                .AsNoTracking()
                .Where(ws => ids.Contains(ws.Id))
                .Select(WeeklyScheduleReadDto.ToDtoProjection)
                .ToListAsync();

            Dictionary<int, WeeklyScheduleReadDto> byId = result.ToDictionary(item => item.Id);
            return Result<List<WeeklyScheduleReadDto>>.Success(ids.Select(id => byId[id]).ToList());
        }

        public async Task<Result<List<WeeklyScheduleReadDto>>> UpdateBulkAsync(IEnumerable<WeeklyScheduleBulkUpdateItem> items)
        {
            List<WeeklyScheduleBulkUpdateItem> requested = items.ToList();
            if (requested.Count == 0)
                return _Failure<List<WeeklyScheduleReadDto>>(_ValidationFailure(WeeklyScheduleErrors.Validation.BulkItemsRequired));

            if (requested.Select(item => item.Id).Distinct().Count() != requested.Count)
            {
                return _Failure<List<WeeklyScheduleReadDto>>(
                    Result.Failure(ErrorType.Conflict, WeeklyScheduleErrors.BulkDuplicateIds));
            }

            List<int> ids = requested.Select(item => item.Id).ToList();
            Dictionary<int, WeeklySchedule> existing = await _db.WeeklySchedules
                .Where(ws => ids.Contains(ws.Id) && ws.DeletedAt == null)
                .ToDictionaryAsync(ws => ws.Id);

            if (existing.Count != ids.Count)
                return _Failure<List<WeeklyScheduleReadDto>>(Result.Failure(ErrorType.NotFound, WeeklyScheduleErrors.NotFound));

            Result validation = _ValidateDuplicateSlots(requested.Select(item => item.ToWriteDto()));
            if (validation.IsFailure)
                return _Failure<List<WeeklyScheduleReadDto>>(validation);

            await using var transaction = await _db.Database.BeginTransactionAsync();

            foreach (WeeklyScheduleBulkUpdateItem item in requested)
            {
                WeeklyScheduleWriteDto dto = item.ToWriteDto();
                validation = _ValidateShape(dto);
                if (validation.IsFailure)
                    return _Failure<List<WeeklyScheduleReadDto>>(validation);

                validation = await _ValidateReferencesAsync(dto);
                if (validation.IsFailure)
                    return _Failure<List<WeeklyScheduleReadDto>>(validation);

                validation = await _ValidateSlotConflictsAsync(dto, ids);
                if (validation.IsFailure)
                    return _Failure<List<WeeklyScheduleReadDto>>(validation);

                _Apply(existing[item.Id], dto);
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            List<WeeklyScheduleReadDto> result = await _db.WeeklySchedules
                .AsNoTracking()
                .Where(ws => ids.Contains(ws.Id))
                .Select(WeeklyScheduleReadDto.ToDtoProjection)
                .ToListAsync();

            Dictionary<int, WeeklyScheduleReadDto> byId = result.ToDictionary(item => item.Id);
            return Result<List<WeeklyScheduleReadDto>>.Success(ids.Select(id => byId[id]).ToList());
        }

        private async Task<Result> _ValidateReferencesAsync(WeeklyScheduleWriteDto dto)
        {
            if (!await _db.Teachers.AnyAsync(t => t.Id == dto.TeacherId && t.DeletedAt == null))
                return Result.Failure(ErrorType.NotFound, WeeklyScheduleErrors.TeacherNotFound);

            if (dto.ClassId.HasValue && !await _db.Classes.AnyAsync(c => c.Id == dto.ClassId.Value && c.DeletedAt == null))
                return Result.Failure(ErrorType.NotFound, WeeklyScheduleErrors.ClassNotFound);

            if (dto.EventId.HasValue && !await _db.EventKeys.AnyAsync(e => e.Id == dto.EventId.Value && e.DeletedAt == null))
                return Result.Failure(ErrorType.NotFound, WeeklyScheduleErrors.EventNotFound);

            return Result.Success();
        }

        private async Task<Result> _ValidateSlotConflictsAsync(WeeklyScheduleWriteDto dto, IEnumerable<int>? excludeIds)
        {
            List<int> excluded = excludeIds?.ToList() ?? [];
            IQueryable<WeeklySchedule> active = _db.WeeklySchedules.Where(ws =>
                ws.DeletedAt == null &&
                ws.DayOfWeek == dto.DayOfWeek &&
                ws.PeriodNumber == dto.PeriodNumber &&
                !excluded.Contains(ws.Id));

            if (await active.AnyAsync(ws => ws.TeacherId == dto.TeacherId))
                return Result.Failure(ErrorType.Conflict, WeeklyScheduleErrors.TeacherSlotConflict);

            if (dto.ClassId.HasValue && await active.AnyAsync(ws => ws.ClassId == dto.ClassId.Value))
                return Result.Failure(ErrorType.Conflict, WeeklyScheduleErrors.ClassSlotConflict);

            if (dto.EventId.HasValue && await active.AnyAsync(ws => ws.EventId == dto.EventId.Value))
                return Result.Failure(ErrorType.Conflict, WeeklyScheduleErrors.EventSlotConflict);

            return Result.Success();
        }

        private static Result _ValidateShape(WeeklyScheduleWriteDto dto)
        {
            if (dto.TeacherId <= 0)
                return _ValidationFailure(WeeklyScheduleErrors.Validation.TeacherIdRequired);

            if (dto.DayOfWeek is < 1 or > 5)
                return _ValidationFailure(WeeklyScheduleErrors.Validation.InvalidDayOfWeek);

            if (dto.PeriodNumber is < 1 or > 7)
                return _ValidationFailure(WeeklyScheduleErrors.Validation.InvalidPeriodNumber);

            if (dto.ClassId is <= 0 || dto.EventId is <= 0)
                return _ValidationFailure(WeeklyScheduleErrors.Validation.InvalidReferenceId);

            if (!dto.ClassId.HasValue && !dto.EventId.HasValue)
                return _ValidationFailure(WeeklyScheduleErrors.Validation.ClassOrEventRequired);

            if (dto.ClassId.HasValue && dto.EventId.HasValue)
                return _ValidationFailure(WeeklyScheduleErrors.Validation.ClassAndEventMutuallyExclusive);

            return Result.Success();
        }

        private static Result _ValidateDuplicateSlots(IEnumerable<WeeklyScheduleWriteDto> items)
        {
            List<WeeklyScheduleWriteDto> requested = items.ToList();
            HashSet<(int TeacherId, int Day, int Period)> teacherSlots = [];
            HashSet<(int ClassId, int Day, int Period)> classSlots = [];
            HashSet<(int EventId, int Day, int Period)> eventSlots = [];

            foreach (WeeklyScheduleWriteDto item in requested)
            {
                if (!teacherSlots.Add((item.TeacherId, item.DayOfWeek, item.PeriodNumber)))
                    return Result.Failure(ErrorType.Conflict, WeeklyScheduleErrors.TeacherSlotConflict);

                if (item.ClassId.HasValue && !classSlots.Add((item.ClassId.Value, item.DayOfWeek, item.PeriodNumber)))
                    return Result.Failure(ErrorType.Conflict, WeeklyScheduleErrors.ClassSlotConflict);

                if (item.EventId.HasValue && !eventSlots.Add((item.EventId.Value, item.DayOfWeek, item.PeriodNumber)))
                    return Result.Failure(ErrorType.Conflict, WeeklyScheduleErrors.EventSlotConflict);
            }

            return Result.Success();
        }

        private static void _Apply(WeeklySchedule entity, WeeklyScheduleWriteDto dto)
        {
            entity.TeacherId = dto.TeacherId;
            entity.DayOfWeek = dto.DayOfWeek;
            entity.PeriodNumber = dto.PeriodNumber;
            entity.ClassId = dto.ClassId;
            entity.EventId = dto.EventId;
            entity.UpdatedAt = DateTime.UtcNow;
        }

        private static Result _ValidationFailure(string messagePair)
        {
            string[] messages = messagePair.Split('|', 2);
            return Result.Failure(
                ErrorType.Validation,
                Error.Create("WEEKLY_SCHEDULE_VALIDATION", messages[0], messages.Length > 1 ? messages[1] : messages[0]));
        }

        private static Result<T> _Failure<T>(Result result) =>
            Result<T>.Failure(result.ErrorType, result.Error);
    }
}
