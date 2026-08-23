using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Features.Reports.Dtos;

namespace TeacherSubApp.Api.Features.Reports
{
    public interface IReportService
    {
        Task<Result<DailyReportReadDto>> GetDailyReportAsync(DailyReportQuery query);
        Task<Result<TeacherReportReadDto>> GetTeacherReportAsync(TeacherReportQuery query);
    }
}