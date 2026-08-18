using TeacherSubApp.Api.Common.Extensions;

var builder = WebApplication.CreateBuilder(args);

// ── Services ──────────────────────────────────────────────────────────────

builder.Services.AddAppDatabase(builder.Configuration);
builder.Services.AddAppInfrastructure();
builder.Services.AddAppFeatures();

// ── Building ──────────────────────────────────────────────────────────────

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy
            .WithOrigins("http://localhost:5173")
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