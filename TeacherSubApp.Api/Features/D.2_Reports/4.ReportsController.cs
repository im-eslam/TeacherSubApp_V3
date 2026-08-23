using Microsoft.AspNetCore.Mvc;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Common.Controllers;
using TeacherSubApp.Api.Features.Reports.Dtos;

namespace TeacherSubApp.Api.Features.Reports
{
    [Route("api/reports")]
    public class ReportsController : AppControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService service, ILogger<ReportsController> logger) : base(logger)
        {
            _reportService = service;
        }

        // GET api/reports/daily?date=2026-01-15
        [HttpGet("daily")]
        [ProducesResponseType<DailyReportReadDto>(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetDaily([FromQuery] DailyReportQuery query)
        {
            Result<DailyReportReadDto> result = await _reportService.GetDailyReportAsync(query);
            return HandleResult(result);
        }

        // GET api/reports/teacher?teacherId=5&fromDate=2026-01-01&toDate=2026-01-31
        [HttpGet("teacher")]
        [ProducesResponseType<TeacherReportReadDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetTeacherReport([FromQuery] TeacherReportQuery query)
        {
            Result<TeacherReportReadDto> result = await _reportService.GetTeacherReportAsync(query);
            return HandleResult(result);
        }
    }
}