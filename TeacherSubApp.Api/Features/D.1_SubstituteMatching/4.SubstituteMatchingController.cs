using Microsoft.AspNetCore.Mvc;
using TeacherSubApp.Api.Common.Controllers;
using TeacherSubApp.Api.Features.Substitutions;

namespace TeacherSubApp.Api.Features.SubstituteMatching
{
    [Route("api/substitute-matching")]
    public class SubstituteMatchingController : AppControllerBase
    {
        private readonly ISubstituteMatchingService _service;
        public SubstituteMatchingController(ISubstituteMatchingService service, ILogger<SubstitutionsController> logger) : base(logger)
        {
            _service = service;
        }
    }
}