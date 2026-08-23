using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.Reports
{
    public partial class ReportService : IReportService
    {
        private readonly AppDbContext _db;

        public ReportService(AppDbContext db)
        {
            _db = db;
        }

        protected Task<Result> _ValidateDateRangeAsync(DateOnly fromDate, DateOnly toDate)
        {
            Result result;
            if (fromDate == DateOnly.MinValue || toDate == DateOnly.MinValue || fromDate > toDate)
            {
                result = Result.Failure(ErrorType.Validation, ReportErrors.InvalidDateRange);
            }
            else if (toDate.DayNumber - fromDate.DayNumber + 1 > Dtos.ReportQueryLimits.MaxDateRangeDays)
            {
                result = Result.Failure(ErrorType.Validation, ReportErrors.DateRangeTooLarge);
            }
            else
            {
                result = Result.Success();
            }

            return Task.FromResult(result);
        }

        protected Task<Result> _ValidateDailyDateAsync(DateOnly date)
        {
            Result result = date == DateOnly.MinValue
                ? Result.Failure(ErrorType.Validation, ReportErrors.DateRequired)
                : Result.Success();
            return Task.FromResult(result);
        }

        protected async Task<Result<Teacher>> _GetActiveTeacherAsync(int teacherId)
        {
            Teacher? teacher = await _db.Teachers
                .AsNoTracking()
                .Include(t => t.Subject)
                .FirstOrDefaultAsync(t => t.Id == teacherId && t.DeletedAt == null);

            return teacher is null
                ? Result<Teacher>.Failure(ErrorType.NotFound, ReportErrors.TeacherNotFound)
                : Result<Teacher>.Success(teacher);
        }

        protected static Result _ValidateTopCount(int topCount)
        {
            return topCount is < 1 or > Dtos.ReportQueryLimits.MaxTopCount
                ? Result.Failure(ErrorType.Validation, ReportErrors.InvalidTopCount)
                : Result.Success();
        }
    }
}
