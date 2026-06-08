using Library.Api.Domain;
using MediatR;

namespace Library.Api.Application.Commands.Books;

public class UpdateBookCommandHandler(IBookRepository repository) : IRequestHandler<UpdateBookCommand>
{
    public async Task Handle(UpdateBookCommand request, CancellationToken cancellationToken)
    {
        var book = await repository.GetByIdAsync(request.Id)
            ?? throw new KeyNotFoundException($"Book with id {request.Id} not found.");

        book.Title = request.Title;
        book.Author = request.Author;
        book.ISBN = request.ISBN;
        book.Year = request.Year;
        book.CategoryId = request.CategoryId;
        book.LastChange = DateTimeOffset.Now;

        await repository.UpdateAsync(book);
    }
}