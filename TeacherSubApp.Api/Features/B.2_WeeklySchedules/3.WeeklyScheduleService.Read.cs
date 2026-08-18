using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.WeeklySchedules.Dtos;

namespace TeacherSubApp.Api.Features.WeeklySchedules
{
    public partial class WeeklyScheduleService : IWeeklyScheduleService
    {
        private const int MinDay = 1;
        private const int MaxDay = 5;
        private const int MinPeriod = 1;
        private const int MaxPeriod = 7;

        private readonly AppDbContext _db;

        public WeeklyScheduleService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Result<WeeklyScheduleGridDto>> GetGridAsync(WeeklyScheduleQuery query)
        {
            List<Func<Task<Result>>> rules =
            [
                () => _CheckTeacherExistsAsync(query.TeacherId),
                () => _CheckClassExistsAsync(query.ClassId)
            ];

            foreach(Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if(res.IsFailure)
                {
                    return Result<WeeklyScheduleGridDto>.Failure(res.ErrorType, res.Error);
                }
            }

            List<WeeklyScheduleReadDto> occupied = await _FetchOccupiedAsync(query);

            bool isDenseTeacherView = _IsDenseTeacherView(query);
            List<WeeklyScheduleReadDto> slots = isDenseTeacherView
                ? await _DensifyForTeacherAsync(query.TeacherId!.Value, occupied)
                : occupied;

            WeeklyScheduleGridDto grid = _BuildGridDto(query, slots);
            return Result<WeeklyScheduleGridDto>.Success(grid);
        }

        #region === Grid Query - Helpers ===

        // Read
        private async Task<List<WeeklyScheduleReadDto>> _FetchOccupiedAsync(WeeklyScheduleQuery query)
        {
            IQueryable<WeeklySchedule> q = _db.WeeklySchedules.AsNoTracking().Where(ws => ws.DeletedAt == null);

            if(query.TeacherId.HasValue)
                q = q.Where(ws => ws.TeacherId == query.TeacherId.Value);

            if(query.ClassId.HasValue)
                q = q.Where(ws => ws.ClassId == query.ClassId.Value);

            if(query.EventId.HasValue)
                q = q.Where(ws => ws.EventId == query.EventId.Value);

            if(query.DayOfWeek.HasValue)
                q = q.Where(ws => ws.DayOfWeek == query.DayOfWeek.Value);

            if(query.PeriodNumber.HasValue)
                q = q.Where(ws => ws.PeriodNumber == query.PeriodNumber.Value);

            return await q
                .OrderBy(ws => ws.DayOfWeek)
                .ThenBy(ws => ws.PeriodNumber)
                .Select(WeeklyScheduleReadDto.ToDtoProjection)
                .ToListAsync();
        }

        // Validation
        private async Task<Result> _CheckTeacherExistsAsync(int? teacherId)
        {
            if(!teacherId.HasValue)
                return Result.Success();

            bool exists = await _db.Teachers
                .AnyAsync(t => t.Id == teacherId.Value && t.DeletedAt == null);

            return exists
                ? Result.Success()
                : Result.Failure(ErrorType.NotFound, WeeklyScheduleErrors.TeacherNotFound);
        }

        private async Task<Result> _CheckClassExistsAsync(int? classId)
        {
            if(!classId.HasValue)
                return Result.Success();

            bool exists = await _db.Classes
                .AnyAsync(c => c.Id == classId.Value && c.DeletedAt == null);

            return exists
                ? Result.Success()
                : Result.Failure(ErrorType.NotFound, WeeklyScheduleErrors.ClassNotFound);
        }

        // State
        private static bool _IsDenseTeacherView(WeeklyScheduleQuery query)
        {
            return query.TeacherId.HasValue
                && query.ClassId is null
                && query.EventId is null
                && query.DayOfWeek is null
                && query.PeriodNumber is null;
        }

        // Densification
        private async Task<List<WeeklyScheduleReadDto>> _DensifyForTeacherAsync(int teacherId, List<WeeklyScheduleReadDto> occupied)
        {
            string teacherName;
            int? subjectId;
            string? subjectName;

            if(occupied.Count > 0)
            {
                teacherName = occupied[0].TeacherName;
                subjectId = occupied[0].TeacherSubjectId;
                subjectName = occupied[0].TeacherSubjectName;
            }
            else
            {
                (teacherName, subjectId, subjectName) = await _GetTeacherInfoAsync(teacherId);
            }

            HashSet<(int Day, int Period)> occupiedCoords = _GetOccupiedCoords(occupied);

            List<WeeklyScheduleReadDto> dense = new(occupied);

            for(int day = MinDay; day <= MaxDay; day++)
            {
                for(int period = MinPeriod; period <= MaxPeriod; period++)
                {
                    if(occupiedCoords.Contains((day, period)))
                        continue;

                    dense.Add(_BuildVirtualEmptySlot(teacherId, teacherName, subjectId, subjectName, day, period));
                }
            }

            return dense
                .OrderBy(s => s.DayOfWeek)
                .ThenBy(s => s.PeriodNumber)
                .ToList();
        }

        private async Task<(string Name, int? SubjectId, string? SubjectName)> _GetTeacherInfoAsync(int teacherId)
        {
            var info = await _db.Teachers.AsNoTracking()
                .Where(t => t.Id == teacherId)
                .Select(t => new
                {
                    t.Name,
                    t.SubjectId,
                    SubjectName = t.Subject != null ? t.Subject.Name : null
                })
                .FirstOrDefaultAsync();

            return (info?.Name ?? string.Empty, info?.SubjectId, info?.SubjectName);
        }

        private static HashSet<(int Day, int Period)> _GetOccupiedCoords(List<WeeklyScheduleReadDto> occupied)
        {
            return occupied
                .Select(s => (s.DayOfWeek, s.PeriodNumber))
                .ToHashSet();
        }

        private static WeeklyScheduleReadDto _BuildVirtualEmptySlot(int teacherId, string teacherName, int? subjectId, string? subjectName, int day, int period)
        {
            return new WeeklyScheduleReadDto
            {
                Id = 0,
                TeacherId = teacherId,
                TeacherName = teacherName,
                TeacherSubjectId = subjectId,
                TeacherSubjectName = subjectName,
                DayOfWeek = day,
                PeriodNumber = period,
                ClassId = null,
                ClassDisplayName = null,
                EventId = null,
                EventName = null
            };
        }

        // Grid DTO
        private static WeeklyScheduleGridDto _BuildGridDto(WeeklyScheduleQuery query, List<WeeklyScheduleReadDto> slots)
        {
            return new WeeklyScheduleGridDto
            {
                FilteredTeacherId = query.TeacherId,
                FilteredClassId = query.ClassId,
                Slots = slots
            };
        }

        #endregion
    }
}