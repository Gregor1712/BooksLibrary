using BooksLibrary.Api.Domain;
using Mapster;
using MediatR;

namespace BooksLibrary.Api.Application.Queries.Books;

public class BooksQueryHandler(IBookRepository repository)
    : IRequestHandler<GetBookQuery, GetBookQuery.BookDto?>,
      IRequestHandler<GetAllBooksQuery, IEnumerable<GetAllBooksQuery.BookListItem>>
{
    public async Task<GetBookQuery.BookDto?> Handle(GetBookQuery request, CancellationToken cancellationToken)
    {
        var book = await repository.GetByIdAsync(request.Id);
        return book?.Adapt<GetBookQuery.BookDto>();
    }

    public async Task<IEnumerable<GetAllBooksQuery.BookListItem>> Handle(
        GetAllBooksQuery request,
        CancellationToken cancellationToken)
    {
        var books = await repository.GetAllAsync();
        return books.Adapt<IEnumerable<GetAllBooksQuery.BookListItem>>();
    }
}