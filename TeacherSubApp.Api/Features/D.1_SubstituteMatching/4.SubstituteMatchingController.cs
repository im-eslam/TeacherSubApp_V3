using Microsoft.AspNetCore.Mvc;
using TeacherSubApp.Api.Common.Controllers;
using TeacherSubApp.Api.Features.SubstituteMatching.Dtos;

namespace TeacherSubApp.Api.Features.SubstituteMatching
{
    [Route("api/recommendations")]
    public class SubstituteMatchingController : AppControllerBase
    {
        private readonly ISubstituteMatchingService _service;

        public SubstituteMatchingController(
            ISubstituteMatchingService service,
            ILogger<SubstituteMatchingController> logger) : base(logger)
        {
            _service = service;
        }

        // GET: api/substitute-matching/settings
        [HttpGet("settings")]
        [ProducesResponseType<AlgorithmSettingsDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetSettings()
        {
            var result = await _service.GetSettingsAsync();
            return HandleResult(result);
        }

        // PUT: api/substitute-matching/settings
        [HttpPut("settings")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateSettings([FromBody] AlgorithmSettingsDto dto)
        {
            var result = await _service.UpdateSettingsAsync(dto);
            return HandleResult(result);
        }

        // GET: api/substitute-matching/recommendations?absentTeacherId=1&dayOfWeek=2&periodNumber=3
        [HttpGet("recommendations")]
        [ProducesResponseType<List<SubstituteCandidateDto>>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetRecommendations([FromQuery] SubstituteMatchQuery query)
        {
            var result = await _service.GetRecommendationsAsync(query);
            return HandleResult(result);
        }
    }
}