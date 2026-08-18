using Microsoft.AspNetCore.Mvc;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Common.Controllers;
using TeacherSubApp.Api.Features.Teachers.Dtos;

namespace TeacherSubApp.Api.Features.Teachers
{
    [Route("api/teachers")]
    public class TeachersController : AppControllerBase
    {
        private readonly ITeacherService _teacherService;

        public TeachersController(ITeacherService service, ILogger<TeachersController> logger) : base(logger)
        {
            _teacherService = service;
        }

        // GET api/teachers
        // GET api/teachers?name=john&subjectId=1&isSupervisor=false
        [HttpGet]
        [ProducesResponseType<List<TeacherReadDto>>(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] TeacherQuery query)
        {
            Result<List<TeacherReadDto>> result = await _teacherService.GetAllAsync(query);
            return HandleResult(result);
        }

        // GET api/teachers/5
        [HttpGet("{id:int}")]
        [ProducesResponseType<TeacherReadDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            Result<TeacherReadDto> result = await _teacherService.GetByIdAsync(id);
            return HandleResult(result);
        }

        // POST api/teachers
        [HttpPost]
        [ProducesResponseType<TeacherReadDto>(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Create([FromBody] TeacherWriteDto dto)
        {
            Result<TeacherReadDto> result = await _teacherService.CreateAsync(dto);
            if (result.IsFailure)
                return HandleResult(result);

            return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
        }

        // PUT api/teachers/5
        [HttpPut("{id:int}")]
        [ProducesResponseType<TeacherReadDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Update(int id, [FromBody] TeacherWriteDto dto)
        {
            Result<TeacherReadDto> result = await _teacherService.UpdateAsync(id, dto);
            return HandleResult(result);
        }

        // DELETE api/teachers/5
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id)
        {
            Result result = await _teacherService.DeleteAsync(id);
            return HandleResult(result);
        }
    }
}