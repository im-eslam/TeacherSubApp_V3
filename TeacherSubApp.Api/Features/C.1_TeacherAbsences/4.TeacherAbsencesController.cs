using Microsoft.AspNetCore.Mvc;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Common.Controllers;
using TeacherSubApp.Api.Features.TeacherAbsences.Dtos;

namespace TeacherSubApp.Api.Features.TeacherAbsences
{
    [Route("api/teacher-absences")]
    public class TeacherAbsencesController : AppControllerBase
    {
        private readonly ITeacherAbsenceService _teacherAbsenceService;

        public TeacherAbsencesController(
            ITeacherAbsenceService service,
            ILogger<TeacherAbsencesController> logger) : base(logger)
        {
            _teacherAbsenceService = service;
        }

        // GET api/teacher-absences?teacherId=1&fromDate=2026-01-01&toDate=2026-01-31
        [HttpGet]
        [ProducesResponseType<List<TeacherAbsenceReadDto>>(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] TeacherAbsenceQuery query)
        {
            Result<List<TeacherAbsenceReadDto>> result = await _teacherAbsenceService.GetAllAsync(query);
            return HandleResult(result);
        }

        // GET api/teacher-absences/5
        [HttpGet("{id:int}")]
        [ProducesResponseType<TeacherAbsenceReadDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            Result<TeacherAbsenceReadDto> result = await _teacherAbsenceService.GetByIdAsync(id);
            return HandleResult(result);
        }

        // POST api/teacher-absences
        [HttpPost]
        [ProducesResponseType<TeacherAbsenceReadDto>(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Create([FromBody] TeacherAbsenceWriteDto dto)
        {
            Result<TeacherAbsenceReadDto> result = await _teacherAbsenceService.CreateAsync(dto);
            return HandleResult(result, nameof(GetById), val => new { id = val.Id });
        }

        // PUT api/teacher-absences/5
        [HttpPut("{id:int}")]
        [ProducesResponseType<TeacherAbsenceReadDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Update(int id, [FromBody] TeacherAbsenceWriteDto dto)
        {
            Result<TeacherAbsenceReadDto> result = await _teacherAbsenceService.UpdateAsync(id, dto);
            return HandleResult(result);
        }

        // DELETE api/teacher-absences/5
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id)
        {
            Result result = await _teacherAbsenceService.DeleteAsync(id);
            return HandleResult(result);
        }
    }
}
