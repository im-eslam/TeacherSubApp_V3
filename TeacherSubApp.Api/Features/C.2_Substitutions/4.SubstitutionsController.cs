using Microsoft.AspNetCore.Mvc;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Common.Controllers;
using TeacherSubApp.Api.Features.Substitutions.Dtos;

namespace TeacherSubApp.Api.Features.Substitutions
{
    [Route("api/substitutions")]
    public class SubstitutionsController : AppControllerBase
    {
        private readonly ISubstitutionService _substitutionService;

        public SubstitutionsController(ISubstitutionService service, ILogger<SubstitutionsController> logger) : base(logger)
        {
            _substitutionService = service;
        }

        // GET api/substitutions
        // GET api/substitutions?absenceId=1&weeklyScheduleId=2&substituteTeacherId=3&fromDate=2026-01-01&toDate=2026-01-31&isAlgorithmMatch=true
        [HttpGet]
        [ProducesResponseType<List<SubstitutionReadDto>>(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] SubstitutionQuery query)
        {
            Result<List<SubstitutionReadDto>> result = await _substitutionService.GetAllAsync(query);
            return HandleResult(result);
        }

        // GET api/substitutions/5
        [HttpGet("{id:int}")]
        [ProducesResponseType<SubstitutionReadDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            Result<SubstitutionReadDto> result = await _substitutionService.GetByIdAsync(id);
            return HandleResult(result);
        }

        // POST api/substitutions
        [HttpPost]
        [ProducesResponseType<SubstitutionReadDto>(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Create([FromBody] SubstitutionWriteDto dto)
        {
            Result<SubstitutionReadDto> result = await _substitutionService.CreateAsync(dto);
            return HandleResult(result, nameof(GetById), val => new { id = val.Id });
        }

        // PUT api/substitutions/5
        [HttpPut("{id:int}")]
        [ProducesResponseType<SubstitutionReadDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Update(int id, [FromBody] SubstitutionWriteDto dto)
        {
            Result<SubstitutionReadDto> result = await _substitutionService.UpdateAsync(id, dto);
            return HandleResult(result);
        }

        // DELETE api/substitutions/5
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id)
        {
            Result result = await _substitutionService.DeleteAsync(id);
            return HandleResult(result);
        }
    }
}
