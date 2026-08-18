using TeacherSubApp.Api.Common.Extensions;

var builder = WebApplication.CreateBuilder(args);

// ── Services ──────────────────────────────────────────────────────────────

builder.Services.AddAppDatabase(builder.Configuration);
builder.Services.AddAppInfrastructure();
builder.Services.AddAppFeatures();

// ── Building ──────────────────────────────────────────────────────────────

string[] allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .GetChildren()
    .Select(section => section.Value)
    .OfType<string>()
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .ToArray();

if (allowedOrigins.Length == 0)
{
    throw new InvalidOperationException(
        "At least one origin must be configured under Cors:AllowedOrigins.");
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy
            .WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader());
});

var app = builder.Build();
_ConfigurePipeline(app);
app.Run();

// ── Private helpers ──────────────────────────────────────────────────────

static void _ConfigurePipeline(WebApplication app)
{
    app.UseExceptionHandler();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseHttpsRedirection();

    app.UseCors("AllowReactApp");

    app.UseAuthorization();
    app.MapControllers();
}