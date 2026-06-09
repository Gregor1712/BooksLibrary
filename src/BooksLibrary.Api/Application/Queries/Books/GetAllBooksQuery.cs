using MediatR;

namespace BooksLibrary.Api.Application.Queries.Books;

public record GetAllBooksQuery : IRequest<IEnumerable<GetAllBooksQuery.BookListItem>>
{
    public class BookListItem
    {
        public long Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Author { get; set; } = string.Empty;

        public string ISBN { get; set; } = string.Empty;

        public int Year { get; set; }

        public bool IsAvailable { get; set; }
    }
}