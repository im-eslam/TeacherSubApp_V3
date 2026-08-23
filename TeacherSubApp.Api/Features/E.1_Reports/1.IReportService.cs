using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Features.Reports.Dtos;

namespace TeacherSubApp.Api.Features.Reports
{
    public interface IReportService
    {
        Task<Result<DailyReportDto>> GetDailyReportAsync(DailyReportQuery query);
        Task<Result<TeacherAbsenceHistoryDto>> GetTeacherAbsenceHistoryAsync(int teacherId, TeacherAbsenceHistoryQuery query);
        Task<Result<TeacherWeeklyLoadReportDto>> GetTeacherWeeklyLoadAsync(int teacherId, TeacherWeeklyLoadQuery query);
        Task<Result<TeacherAnalysisDto>> GetTeacherAnalysisAsync(int teacherId, ReportDateRangeQuery query);
        Task<Result<SystemAnalysisDto>> GetSystemAnalysisAsync(ReportDateRangeQuery query, int topCount = ReportQueryLimits.DefaultTopCount);
    }
}
