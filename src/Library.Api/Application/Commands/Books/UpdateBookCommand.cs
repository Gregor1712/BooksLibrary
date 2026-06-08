using MediatR;
using System.Text.Json.Serialization;

namespace Library.Api.Application.Commands.Books;

public class UpdateBookCommand : IRequest
{
    [JsonIgnore]
    public long Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Author { get; set; } = string.Empty;

    public string ISBN { get; set; } = string.Empty;

    public int Year { get; set; }

    public long CategoryId { get; set; }
}