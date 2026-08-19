using Microsoft.AspNetCore.Mvc;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Common.Controllers;
using TeacherSubApp.Api.Features.SchoolClasses.Dtos;

namespace TeacherSubApp.Api.Features.SchoolClasses
{
    [Route("api/classes")]
    public class SchoolClassesController : AppControllerBase
    {
        private readonly ISchoolClassService _classesService;

        public SchoolClassesController(ISchoolClassService service, ILogger<SchoolClassesController> logger) : base(logger)
        {
            _classesService = service;
        }

        // GET api/classes
        // GET api/classes?displayName=grade 1
        [HttpGet]
        [ProducesResponseType<List<SchoolClassReadDto>>(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] SchoolClassQuery query)
        {
            Result<List<SchoolClassReadDto>> result = await _classesService.GetAllAsync(query);
            return HandleResult(result);
        }

        // GET api/classes/5
        [HttpGet("{id:int}")]
        [ProducesResponseType<SchoolClassReadDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            Result<SchoolClassReadDto> result = await _classesService.GetByIdAsync(id);
            return HandleResult(result);
        }

        // POST api/classes
        [HttpPost]
        [ProducesResponseType<SchoolClassReadDto>(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Create([FromBody] SchoolClassWriteDto dto)
        {
            Result<SchoolClassReadDto> result = await _classesService.CreateAsync(dto);
            return HandleResult(result, nameof(GetById), val => new { id = val.Id });
        }

        // PUT api/classes/5
        [HttpPut("{id:int}")]
        [ProducesResponseType<SchoolClassReadDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Update(int id, [FromBody] SchoolClassWriteDto dto)
        {
            Result<SchoolClassReadDto> result = await _classesService.UpdateAsync(id, dto);
            return HandleResult(result);
        }

        // DELETE api/classes/5
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id)
        {
            Result result = await _classesService.DeleteAsync(id);
            return HandleResult(result);
        }

        // GET api/classes/grades
        [HttpGet("grades")]
        [ProducesResponseType<List<int>>(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetGrades()
        {
            Result<List<int>> result = await _classesService.GetUniqueGradesAsync();
            return HandleResult(result);
        }

        // GET api/classes/grades/5/sections
        [HttpGet("grades/{grade:int}/sections")]
        [ProducesResponseType<List<int>>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetSectionsForGrade(int grade)
        {
            Result<List<int>> result = await _classesService.GetUniqueSectionsForGradeAsync(grade);
            return HandleResult(result);
        }
    }
}