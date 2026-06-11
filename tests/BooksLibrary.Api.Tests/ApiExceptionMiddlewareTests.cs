using System.Text.Json;
using BooksLibrary.Api.Infrastructure.Middleware;
using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace BooksLibrary.Api.Tests;

public class ApiExceptionMiddlewareTests
{
    [Fact]
    public async Task Handle_ValidationException_Returns400WithDetail()
    {
        var context = await InvokeWithExceptionAsync(new ValidationException("Title is required"));

        context.Response.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        var body = await ReadBodyAsync(context);
        body.GetProperty("detail").GetString().Should().Contain("Title is required");
    }

    [Fact]
    public async Task Handle_InvalidOperationException_Returns409WithDetail()
    {
        var context = await InvokeWithExceptionAsync(
            new InvalidOperationException("Member has reached the maximum of 5 active loans."));

        context.Response.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        var body = await ReadBodyAsync(context);
        body.GetProperty("detail").GetString()
            .Should().Be("Member has reached the maximum of 5 active loans.");
    }

    [Fact]
    public async Task Handle_KeyNotFoundException_Returns404()
    {
        var context = await InvokeWithExceptionAsync(new KeyNotFoundException("Book with id 99 not found."));

        context.Response.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Handle_UnknownException_Returns500WithGenericDetail()
    {
        var context = await InvokeWithExceptionAsync(new Exception("secret internals"));

        context.Response.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
        var body = await ReadBodyAsync(context);
        body.GetProperty("detail").GetString().Should().NotContain("secret internals");
    }

    [Fact]
    public async Task Handle_NoException_PassesThrough()
    {
        var middleware = new ApiExceptionMiddleware(_ => Task.CompletedTask);
        var context = new DefaultHttpContext();

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    private static async Task<HttpContext> InvokeWithExceptionAsync(Exception exception)
    {
        var middleware = new ApiExceptionMiddleware(_ => throw exception);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        await middleware.InvokeAsync(context);
        return context;
    }

    private static async Task<JsonElement> ReadBodyAsync(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var json = await reader.ReadToEndAsync();
        return JsonDocument.Parse(json).RootElement;
    }
}