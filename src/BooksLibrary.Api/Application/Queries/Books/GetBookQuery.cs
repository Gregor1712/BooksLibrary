using MediatR;

namespace BooksLibrary.Api.Application.Queries.Books;

public record GetBookQuery(long Id) : IRequest<GetBookQuery.BookDto?>
{
    public class BookDto
    {
        public long Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Author { get; set; } = string.Empty;

        public string ISBN { get; set; } = string.Empty;

        public int Year { get; set; }

        public long CategoryId { get; set; }

        public bool IsAvailable { get; set; }

        public DateTimeOffset Created { get; set; }

        public DateTimeOffset LastChange { get; set; }
    }
}