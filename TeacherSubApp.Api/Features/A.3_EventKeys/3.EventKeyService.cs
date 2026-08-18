using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.EventKeys.Dtos;

namespace TeacherSubApp.Api.Features.EventKeys
{
    public class EventKeyService : IEventKeyService
    {
        private readonly AppDbContext _db;

        public EventKeyService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Result<List<EventKeyReadDto>>> GetAllAsync(EventKeyQuery query)
        {
            List<EventKeyReadDto> eventKeys = await _FetchAllActiveAsync(query);
            return Result<List<EventKeyReadDto>>.Success(eventKeys);
        }

        public async Task<Result<EventKeyReadDto>> GetByIdAsync(int id)
        {
            EventKey? key = await _FindActiveByIdAsync(id);

            return (key is null)
                ? Result<EventKeyReadDto>.Failure(ErrorType.NotFound, EventKeyErrors.NotFound)
                : Result<EventKeyReadDto>.Success(EventKeyReadDto.FromEntity(key));
        }

        public async Task<Result<EventKeyReadDto>> CreateAsync(EventKeyWriteDto dto)
        {
            List<Func<Task<Result>>> rules =
            [
                () => _CheckNameConflictAsync(dto.EventName, null),
                () => _CheckExclusiveFlagsAsync(dto.IsSupport, dto.IsStandby),
                () => _CheckSupportConflictAsync(dto.IsSupport, null),
                () => _CheckStandbyConflictAsync(dto.IsStandby, null)
            ];

            foreach (Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if (res.IsFailure)
                {
                    return Result<EventKeyReadDto>.Failure(res.ErrorType, res.Error);
                }
            }

            EventKey created = await _PersistNewAsync(dto);
            return Result<EventKeyReadDto>.Success(EventKeyReadDto.FromEntity(created));
        }

        public async Task<Result<EventKeyReadDto>> UpdateAsync(int id, EventKeyWriteDto dto)
        {
            EventKey? key = await _FindActiveByIdAsync(id);
            if (key is null)
            {
                return Result<EventKeyReadDto>.Failure(ErrorType.NotFound, EventKeyErrors.NotFound);
            }

            (bool nameChanged, bool flagChanged) = _DetectChanges(key, dto);
            if (!nameChanged && !flagChanged)
            {
                return Result<EventKeyReadDto>.Success(EventKeyReadDto.FromEntity(key));
            }

            List<Func<Task<Result>>> rules = [];
            if (nameChanged)
            {
                rules.Add(() => _CheckNameConflictAsync(dto.EventName, id));
            }
            if (flagChanged)
            {
                rules.Add(() => _CheckExclusiveFlagsAsync(dto.IsSupport, dto.IsStandby));
                rules.Add(() => _CheckSupportConflictAsync(dto.IsSupport, id));
                rules.Add(() => _CheckStandbyConflictAsync(dto.IsStandby, id));
            }

            foreach (Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if (res.IsFailure)
                {
                    return Result<EventKeyReadDto>.Failure(res.ErrorType, res.Error);
                }
            }

            EventKey updated = await _ApplyUpdateAsync(key, dto);
            return Result<EventKeyReadDto>.Success(EventKeyReadDto.FromEntity(updated));
        }

        public async Task<Result> DeleteAsync(int id)
        {
            EventKey? key = await _FindActiveByIdAsync(id);
            if (key is null)
            {
                return Result.Failure(ErrorType.NotFound, EventKeyErrors.NotFound);
            }

            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                await _CascadeSoftDeleteWeeklySchedulesAsync(id);
                await _SoftDeleteAsync(key);

                await tx.CommitAsync();
                return Result.Success();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        #region === Private Helpers ===

        // Read 
        private async Task<List<EventKeyReadDto>> _FetchAllActiveAsync(EventKeyQuery query)
        {
            IQueryable<EventKey> q = _db.EventKeys.AsNoTracking()
                                                  .Where(e => e.DeletedAt == null);

            if (!string.IsNullOrWhiteSpace(query.EventName))
                q = q.Where(e => EF.Functions.ILike(e.EventName, $"%{query.EventName.Trim()}%"));

            if (query.IsSupport.HasValue)
                q = q.Where(e => e.IsSupport == query.IsSupport);

            if (query.IsStandby.HasValue)
                q = q.Where(e => e.IsStandby == query.IsStandby);

            return await q.OrderBy(e => e.EventName)
                          .Select(EventKeyReadDto.ToDtoProjection)
                          .ToListAsync();
        }

        private Task<EventKey?> _FindActiveByIdAsync(int id)
        {
            return _db.EventKeys.FirstOrDefaultAsync(e => e.Id == id && e.DeletedAt == null);
        }

        // Validation 
        private async Task<Result> _CheckNameConflictAsync(string name, int? excludeId)
        {
            string clean = name.Trim();

            bool exists = await _db.EventKeys
                .AnyAsync(e => e.DeletedAt == null
                && EF.Functions.ILike(e.EventName, clean)
                && (excludeId == null || e.Id != excludeId));

            return exists
                ? Result.Failure(ErrorType.Conflict, EventKeyErrors.NameExists)
                : Result.Success();
        }

        private Task<Result> _CheckExclusiveFlagsAsync(bool isSupport, bool isStandby)
        {
            return isSupport && isStandby
                ? Task.FromResult(Result.Failure(ErrorType.Validation, EventKeyErrors.FlagsConflict))
                : Task.FromResult(Result.Success());
        }

        private async Task<Result> _CheckSupportConflictAsync(bool isSupport, int? excludeId)
        {
            if (!isSupport) 
                return Result.Success();

            bool taken = await _db.EventKeys
                .AnyAsync(e => e.DeletedAt == null
                && e.IsSupport
                && (excludeId == null || e.Id != excludeId));

            return taken
                ? Result.Failure(ErrorType.Conflict, EventKeyErrors.SupportConflict)
                : Result.Success();
        }

        private async Task<Result> _CheckStandbyConflictAsync(bool isStandby, int? excludeId)
        {
            if (!isStandby) return Result.Success();

            bool taken = await _db.EventKeys
                .AnyAsync(e => e.DeletedAt == null
                && e.IsStandby
                && (excludeId == null || e.Id != excludeId));

            return taken
                ? Result.Failure(ErrorType.Conflict, EventKeyErrors.StandbyConflict)
                : Result.Success();
        }

        // State 
        private static (bool NameChanged, bool FlagChanged) _DetectChanges(EventKey entity, EventKeyWriteDto dto)
        {
            bool nameChanged = !string.Equals(entity.EventName.Trim(), dto.EventName.Trim(), StringComparison.OrdinalIgnoreCase);
            bool flagChanged = entity.IsSupport != dto.IsSupport || entity.IsStandby != dto.IsStandby;

            return (nameChanged, flagChanged);
        }

        // Create / Update
        private async Task<EventKey> _PersistNewAsync(EventKeyWriteDto dto)
        {
            EventKey entity = EventKeyWriteDto.ToEntity(dto);
            _db.EventKeys.Add(entity);
            await _db.SaveChangesAsync();
            return entity;
        }

        private async Task<EventKey> _ApplyUpdateAsync(EventKey entity, EventKeyWriteDto dto)
        {
            entity.EventName = dto.EventName.Trim();
            entity.IsSupport = dto.IsSupport;
            entity.IsStandby = dto.IsStandby;

            entity.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return entity;
        }

        // Delete 
        private async Task _CascadeSoftDeleteWeeklySchedulesAsync(int eventId)
        {
            DateTime now = DateTime.UtcNow;

            await _db.WeeklySchedules
                     .Where(ws => ws.EventId == eventId && ws.DeletedAt == null)
                     .ExecuteUpdateAsync(setters => setters
                         .SetProperty(ws => ws.DeletedAt, now)
                         .SetProperty(ws => ws.UpdatedAt, now));
        }

        private async Task _SoftDeleteAsync(EventKey entity)
        {
            entity.DeletedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        #endregion
    }
}