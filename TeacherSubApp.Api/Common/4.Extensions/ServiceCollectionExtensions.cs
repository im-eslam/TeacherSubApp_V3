using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common.Exceptions;
using TeacherSubApp.Api.Common.Results;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Features.EventKeys;
using TeacherSubApp.Api.Features.SchoolClasses;
using TeacherSubApp.Api.Features.Subjects;
using TeacherSubApp.Api.Features.Teachers;
using TeacherSubApp.Api.Features.WeeklySchedules;

namespace TeacherSubApp.Api.Common.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddAppDatabase(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<AppDbContext>(options =>
                            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));
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
            //services.AddScoped<ITeacherAbsenceService, TeacherAbsenceService>();
            //services.AddScoped<ISubstitutionService, SubstitutionService>();

            return services;
        }

        #region === Helper Methods ===

        private static IActionResult _HandleInvalidModelState(ActionContext context)
        {
            (string msgEn, string msgAr) = _ExtractValidationMessages(context.ModelState);

            _LogValidationFailure(context.HttpContext, msgEn);

            Error validationError = GlobalErrors.ValidationError(msgEn, msgAr);
            ErrorResponse errorPayload = ErrorResponse.From(validationError);

            return new BadRequestObjectResult(errorPayload);
        }

        private static (string MessageEn, string MessageAr) _ExtractValidationMessages(ModelStateDictionary modelState)
        {
            string? firstError = modelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .FirstOrDefault(msg => !string.IsNullOrWhiteSpace(msg));

            if (firstError is null)
            {
                return ("Validation failed.", "فشل التحقق من صحة البيانات.");
            }

            string[] parts = firstError.Split('|');
            string msgEn = parts[0].Trim();
            string msgAr = parts.Length > 1 ? parts[1].Trim() : msgEn;

            return (msgEn, msgAr);
        }

        private static void _LogValidationFailure(HttpContext httpContext, string messageEn)
        {
            ILogger<ActionContext> logger = httpContext.RequestServices.GetRequiredService<ILogger<ActionContext>>();
            PathString path = httpContext.Request.Path;

            logger.LogInformation(
                "Bouncer Validation failure [{Code}]: {Message} | Path: {Path}",
                "VALIDATION_ERROR", messageEn, path);
        }

        #endregion
    }
}