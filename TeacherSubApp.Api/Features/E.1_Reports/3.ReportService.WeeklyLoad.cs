using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.Reports.Dtos;
using TeacherSubApp.Api.Features.Reports.Internal;

namespace TeacherSubApp.Api.Features.Reports
{
    public partial class ReportService
    {
        /// <summary>
        /// BaseWeeklyLoad uses the teacher's current WeeklySchedule, so historical values can shift after schedule edits.
        /// </summary>
        public async Task<Result<TeacherWeeklyLoadReportDto>> GetTeacherWeeklyLoadAsync(
            int teacherId,
            TeacherWeeklyLoadQuery query)
        {
            Result dateValidation = await _ValidateDateRangeAsync(query.FromDate, query.ToDate);
            if (dateValidation.IsFailure)
            {
                return Result<TeacherWeeklyLoadReportDto>.Failure(dateValidation.ErrorType, dateValidation.Error);
            }

            Result<Teacher> teacherResult = await _GetActiveTeacherAsync(teacherId);
            if (teacherResult.IsFailure)
            {
                return Result<TeacherWeeklyLoadReportDto>.Failure(teacherResult.ErrorType, teacherResult.Error);
            }

            Teacher teacher = teacherResult.Value!;
            WeeklyLoadBuildResult load = await new WeeklyLoadBucketBuilder(_db)
                .BuildAsync(teacherId, query.FromDate, query.ToDate);

            return Result<TeacherWeeklyLoadReportDto>.Success(new TeacherWeeklyLoadReportDto(
                teacher.Id,
                teacher.Name,
                teacher.Subject?.Name,
                load.BaseWeeklyLoad,
                query.FromDate,
                query.ToDate,
                load.Buckets));
        }
    }
}
