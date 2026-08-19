using Microsoft.AspNetCore.Mvc;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Common.Controllers;
using TeacherSubApp.Api.Features.Subjects.Dtos;
namespace TeacherSubApp.Api.Features.Subjects
{
    [Route("api/subjects")]
    public class SubjectsController : AppControllerBase
    {
        private readonly ISubjectService _subjectService;

        public SubjectsController(ISubjectService subjectService, ILogger<SubjectsController> logger) : base(logger)
        {
            _subjectService = subjectService;
        }

        // GET api/subjects
        // GET api/subjects?name=math
        [HttpGet]
        [ProducesResponseType<List<SubjectReadDto>>(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] SubjectQuery query)
        {
            Result<List<SubjectReadDto>> result = await _subjectService.GetAllAsync(query);
            return HandleResult(result);
        }

        // GET api/subjects/5
        [HttpGet("{id:int}")]
        [ProducesResponseType<SubjectReadDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            Result<SubjectReadDto> result = await _subjectService.GetByIdAsync(id);
            return HandleResult(result);
        }

        // POST api/subjects
        [HttpPost]
        [ProducesResponseType<SubjectReadDto>(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Create([FromBody] SubjectWriteDto dto)
        {
            Result<SubjectReadDto> result = await _subjectService.CreateAsync(dto);
            return HandleResult(result, nameof(GetById), val => new { id = val.Id });
        }

        // PUT api/subjects/5
        [HttpPut("{id:int}")]
        [ProducesResponseType<SubjectReadDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Update(int id, [FromBody] SubjectWriteDto dto)
        {
            Result<SubjectReadDto> result = await _subjectService.UpdateAsync(id, dto);
            return HandleResult(result);
        }

        // DELETE api/subjects/5
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id)
        {
            Result result = await _subjectService.DeleteAsync(id);
            return HandleResult(result);
        }
    }
}
