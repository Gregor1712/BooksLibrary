using BooksLibrary.Api.Domain;
using Mapster;
using MediatR;

namespace BooksLibrary.Api.Application.Commands.Books;

public class CreateBookCommandHandler(IBookRepository repository) : IRequestHandler<CreateBookCommand, long>
{
    public async Task<long> Handle(CreateBookCommand request, CancellationToken cancellationToken)
    {
        var book = request.Adapt<Book>();
        book.Created = DateTimeOffset.Now;
        book.LastChange = DateTimeOffset.Now;
        book.IsAvailable = true;

        return await repository.CreateAsync(book);
    }
}