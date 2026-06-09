using FluentValidation;
using Kros.KORM.Extensions.Asp;
using BooksLibrary.Api.Application.Behaviors;
using MediatR;
using Scrutor;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// MediatR
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssemblyContaining<Program>());

// FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

// KORM Database
builder.Services.AddKorm(builder.Configuration)
    .UseDatabaseConfiguration<BooksLibrary.Api.Infrastructure.DatabaseConfiguration>()
    .AddKormMigrations()
    .Migrate();

// Auto-register repositories via Scrutor (matches IXxxRepository → XxxRepository)
builder.Services.Scan(scan =>
    scan.FromAssemblyOf<Program>()
        .AddClasses()
        .AsMatchingInterface());

var app = builder.Build();

// Middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseKormMigrations();
app.MapControllers();

app.Run();
