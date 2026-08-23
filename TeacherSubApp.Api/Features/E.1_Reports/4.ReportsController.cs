using Microsoft.AspNetCore.Mvc;
using TeacherSubApp.Api.Common.Controllers;
using TeacherSubApp.Api.Features.Reports.Dtos;

namespace TeacherSubApp.Api.Features.Reports
{
    [Route("api/reports")]
    public sealed class ReportsController : AppControllerBase
    {
        private readonly IReportService _service;

        public ReportsController(
            IReportService service,
            ILogger<ReportsController> logger) : base(logger)
        {
            _service = service;
        }

        [HttpGet("daily")]
        [ProducesResponseType<DailyReportDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetDaily([FromQuery] DailyReportQuery query)
        {
            var result = await _service.GetDailyReportAsync(query);
            return HandleResult(result);
        }

        [HttpGet("teachers/{teacherId:int}/absence-history")]
        [ProducesResponseType<TeacherAbsenceHistoryDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetTeacherAbsenceHistory(
            int teacherId,
            [FromQuery] TeacherAbsenceHistoryQuery query)
        {
            var result = await _service.GetTeacherAbsenceHistoryAsync(teacherId, query);
            return HandleResult(result);
        }

        [HttpGet("teachers/{teacherId:int}/weekly-load")]
        [ProducesResponseType<TeacherWeeklyLoadReportDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetTeacherWeeklyLoad(
            int teacherId,
            [FromQuery] TeacherWeeklyLoadQuery query)
        {
            var result = await _service.GetTeacherWeeklyLoadAsync(teacherId, query);
            return HandleResult(result);
        }

        [HttpGet("teachers/{teacherId:int}/analysis")]
        [ProducesResponseType<TeacherAnalysisDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetTeacherAnalysis(
            int teacherId,
            [FromQuery] ReportDateRangeQuery query)
        {
            var result = await _service.GetTeacherAnalysisAsync(teacherId, query);
            return HandleResult(result);
        }

        [HttpGet("analysis")]
        [ProducesResponseType<SystemAnalysisDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetSystemAnalysis(
            [FromQuery] ReportDateRangeQuery query,
            [FromQuery] int topCount = ReportQueryLimits.DefaultTopCount)
        {
            var result = await _service.GetSystemAnalysisAsync(query, topCount);
            return HandleResult(result);
        }
    }
}
