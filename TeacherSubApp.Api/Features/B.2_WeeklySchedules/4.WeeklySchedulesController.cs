using Microsoft.AspNetCore.Mvc;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Common.Controllers;
using TeacherSubApp.Api.Features.WeeklySchedules.Dtos;

namespace TeacherSubApp.Api.Features.WeeklySchedules
{
    [Route("api/weekly-schedules")]
    public sealed class WeeklySchedulesController : AppControllerBase
    {
        private readonly IWeeklyScheduleService _service;

        public WeeklySchedulesController(IWeeklyScheduleService service, ILogger<WeeklySchedulesController> logger)
            : base(logger)
        {
            _service = service;
        }

        [HttpGet]
        [ProducesResponseType<List<WeeklyScheduleReadDto>>(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] WeeklyScheduleQuery query)
        {
            Result<List<WeeklyScheduleReadDto>> result = await _service.GetAllAsync(query);
            return HandleResult(result);
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType<WeeklyScheduleReadDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            Result<WeeklyScheduleReadDto> result = await _service.GetByIdAsync(id);
            return HandleResult(result);
        }

        [HttpPost]
        [ProducesResponseType<WeeklyScheduleReadDto>(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Create([FromBody] WeeklyScheduleWriteDto dto)
        {
            Result<WeeklyScheduleReadDto> result = await _service.CreateAsync(dto);
            return HandleResult(result, nameof(GetById), value => new { id = value.Id });
        }

        [HttpPost("bulk")]
        [ProducesResponseType<List<WeeklyScheduleReadDto>>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> CreateBulk([FromBody] List<WeeklyScheduleWriteDto> dtos)
        {
            Result<List<WeeklyScheduleReadDto>> result = await _service.CreateBulkAsync(dtos);
            return HandleResult(result);
        }

        [HttpPut("bulk")]
        [ProducesResponseType<List<WeeklyScheduleReadDto>>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> UpdateBulk([FromBody] List<WeeklyScheduleBulkUpdateItem> items)
        {
            Result<List<WeeklyScheduleReadDto>> result = await _service.UpdateBulkAsync(items);
            return HandleResult(result);
        }

        [HttpPut("{id:int}")]
        [ProducesResponseType<WeeklyScheduleReadDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Update(int id, [FromBody] WeeklyScheduleWriteDto dto)
        {
            Result<WeeklyScheduleReadDto> result = await _service.UpdateAsync(id, dto);
            return HandleResult(result);
        }

        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id)
        {
            Result result = await _service.DeleteAsync(id);
            return HandleResult(result);
        }
    }
}
