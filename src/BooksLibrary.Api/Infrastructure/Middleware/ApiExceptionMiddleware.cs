using FluentValidation;

namespace BooksLibrary.Api.Infrastructure.Middleware;

public class ApiExceptionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            var (status, title, detail) = ex switch
            {
                ValidationException => (StatusCodes.Status400BadRequest, "Validation failed", ex.Message),
                KeyNotFoundException => (StatusCodes.Status404NotFound, "Not found", ex.Message),
                InvalidOperationException => (StatusCodes.Status409Conflict, "Business rule violation", ex.Message),
                _ => (StatusCodes.Status500InternalServerError, "Server error", "An unexpected error occurred."),
            };

            context.Response.StatusCode = status;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsJsonAsync(new { status, title, detail });
        }
    }
}