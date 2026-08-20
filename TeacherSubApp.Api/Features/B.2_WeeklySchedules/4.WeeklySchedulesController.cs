using Microsoft.AspNetCore.Mvc;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Common.Controllers;
using TeacherSubApp.Api.Features.WeeklySchedules.Dtos;

namespace TeacherSubApp.Api.Features.WeeklySchedules
{
    public sealed record SwapRequest(SlotCoordinate SlotA, SlotCoordinate SlotB);

    [Route("api/schedules")]
    public class WeeklySchedulesController : AppControllerBase
    {
        private readonly IWeeklyScheduleService _scheduleService;
        public WeeklySchedulesController(IWeeklyScheduleService service, ILogger<WeeklySchedulesController> logger) : base(logger)
        {
            _scheduleService = service;
        }

        // GET api/schedules
        // GET api/schedules?teacherId=1&dayOfWeek=2
        [HttpGet]
        [ProducesResponseType<List<WeeklyScheduleReadDto>>(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] WeeklyScheduleQuery query)
        {
            Result<List<WeeklyScheduleReadDto>> result = await _scheduleService.GetAllAsync(query);
            return HandleResult(result);
        }

        // GET api/schedules/5
        [HttpGet("{id:int}")]
        [ProducesResponseType<WeeklyScheduleReadDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            Result<WeeklyScheduleReadDto> result = await _scheduleService.GetByIdAsync(id);
            return HandleResult(result);
        }

        // POST api/schedules
        [HttpPost]
        [ProducesResponseType<WeeklyScheduleReadDto>(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] WeeklyScheduleWriteDto dto)
        {
            Result<WeeklyScheduleReadDto> result = await _scheduleService.CreateAsync(dto);
            return HandleResult(result, nameof(GetById), val => new { id = val.Id });
        }

        // PUT api/schedules/5
        [HttpPut("{id:int}")]
        [ProducesResponseType<WeeklyScheduleReadDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update(int id, [FromBody] WeeklyScheduleWriteDto dto)
        {
            Result<WeeklyScheduleReadDto> result = await _scheduleService.UpdateAsync(id, dto);
            return HandleResult(result);
        }

        // DELETE api/schedules/5
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Delete(int id)
        {
            Result result = await _scheduleService.DeleteAsync(id);
            return HandleResult(result);
        }

        // POST api/schedules/swap
        [HttpPost("swap")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Swap([FromBody] SwapRequest request)
        {
            Result result = await _scheduleService.SwapAsync(request.SlotA, request.SlotB);
            return HandleResult(result);
        }

        // POST api/schedules/bulk
        [HttpPost("bulk")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> BulkEdit([FromBody] WeeklyScheduleBulkEditRequest request)
        {
            Result result = await _scheduleService.BulkEditAsync(request);
            return HandleResult(result);
        }
    }
}