using Microsoft.AspNetCore.Mvc;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Common.Controllers;
using TeacherSubApp.Api.Features.EventKeys.Dtos;

namespace TeacherSubApp.Api.Features.EventKeys
{
    [Route("api/events")]
    public class EventKeysController : AppControllerBase
    {
        private readonly IEventKeyService _eventsService;

        public EventKeysController(IEventKeyService service, ILogger<EventKeysController> logger) : base(logger)
        {
            _eventsService = service;
        }

        // GET api/events
        // GET api/events?eventName=assembly&isSupport=true
        [HttpGet]
        [ProducesResponseType<List<EventKeyReadDto>>(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] EventKeyQuery query)
        {
            Result<List<EventKeyReadDto>> result = await _eventsService.GetAllAsync(query);
            return HandleResult(result);
        }

        // GET api/events/5
        [HttpGet("{id:int}")]
        [ProducesResponseType<EventKeyReadDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            Result<EventKeyReadDto> result = await _eventsService.GetByIdAsync(id);
            return HandleResult(result);
        }

        // POST api/events
        [HttpPost]
        [ProducesResponseType<EventKeyReadDto>(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Create([FromBody] EventKeyWriteDto dto)
        {
            Result<EventKeyReadDto> result = await _eventsService.CreateAsync(dto);
            if (result.IsFailure)
                return HandleResult(result);

            return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
        }

        // PUT api/events/5
        [HttpPut("{id:int}")]
        [ProducesResponseType<EventKeyReadDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Update(int id, [FromBody] EventKeyWriteDto dto)
        {
            Result<EventKeyReadDto> result = await _eventsService.UpdateAsync(id, dto);
            return HandleResult(result);
        }

        // DELETE api/events/5
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id)
        {
            Result result = await _eventsService.DeleteAsync(id);
            return HandleResult(result);
        }
    }
}