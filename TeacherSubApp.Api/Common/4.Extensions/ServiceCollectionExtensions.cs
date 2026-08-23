using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common.Exceptions;
using TeacherSubApp.Api.Common.Results;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Features.EventKeys;
using TeacherSubApp.Api.Features.SchoolClasses;
using TeacherSubApp.Api.Features.Subjects;
using TeacherSubApp.Api.Features.SubstituteMatching;
using TeacherSubApp.Api.Features.Substitutions;
using TeacherSubApp.Api.Features.TeacherAbsences;
using TeacherSubApp.Api.Features.Teachers;
using TeacherSubApp.Api.Features.WeeklySchedules;
using TeacherSubApp.Api.Features.Reports;

namespace TeacherSubApp.Api.Common.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddAppDatabase(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<AppDbContext>(options => options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));
            return services;
        }

        public static IServiceCollection AddAppInfrastructure(this IServiceCollection services)
        {
            services.AddControllers().ConfigureApiBehaviorOptions(options =>
            {
                options.InvalidModelStateResponseFactory = _HandleInvalidModelState;
            });

            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen();

            services.AddExceptionHandler<GlobalExceptionHandler>();

            services.AddProblemDetails();

            return services;
        }

        public static IServiceCollection AddAppFeatures(this IServiceCollection services)
        {
            services.AddScoped<ISubjectService, SubjectService>();
            services.AddScoped<ISchoolClassService, SchoolClassService>();
            services.AddScoped<IEventKeyService, EventKeyService>();

            services.AddScoped<ITeacherService, TeacherService>();
            services.AddScoped<IWeeklyScheduleService, WeeklyScheduleService>();

            services.AddScoped<ITeacherAbsenceService, TeacherAbsenceService>();
            services.AddScoped<ISubstitutionService, SubstitutionService>();

            services.AddScoped<ISubstituteMatchingService, SubstituteMatchingService>();
            services.AddScoped<IReportService, ReportService>();

            return services;
        }

        #region === Helper Methods ===

        private static IActionResult _HandleInvalidModelState(ActionContext context)
        {
            Error validationError = _GetValidationError(context.ModelState);

            _LogValidationFailure(context.HttpContext, validationError.MessageEn);

            ErrorResponse errorPayload = ErrorResponse.FromError(validationError);
            return new BadRequestObjectResult(errorPayload);
        }

        private static Error _GetValidationError(ModelStateDictionary modelState)
        {
            string? firstError = modelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .FirstOrDefault(msg => !string.IsNullOrWhiteSpace(msg));

            if (string.IsNullOrWhiteSpace(firstError))
                return ModelStateErrors.Default;

            string[] parts = firstError.Split('|');
            string msgEn = parts[0].Trim();
            string msgAr = parts.Length > 1 ? parts[1].Trim() : msgEn;

            return ModelStateErrors.Custom(msgEn, msgAr);
        }

        private static void _LogValidationFailure(HttpContext httpContext, string messageEn)
        {
            ILogger<ActionContext> logger = httpContext.RequestServices.GetRequiredService<ILogger<ActionContext>>();
            PathString path = httpContext.Request.Path;

            logger.LogInformation(
                "ModelState Validation failure [{Code}]: {Message} | Path: {Path}",
                "VALIDATION_ERROR", messageEn, path);
        }

        #endregion
    }
}
