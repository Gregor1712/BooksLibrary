using MediatR;
using System.Text.Json.Serialization;

namespace Library.Api.Application.Commands.Books;

public class CreateBookCommand : IRequest<long>
{
    public string Title { get; set; } = string.Empty;

    public string Author { get; set; } = string.Empty;

    public string ISBN { get; set; } = string.Empty;

    public int Year { get; set; }

    public long CategoryId { get; set; }
}