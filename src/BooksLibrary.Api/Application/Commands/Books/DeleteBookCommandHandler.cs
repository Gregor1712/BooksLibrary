using BooksLibrary.Api.Domain;
using MediatR;

namespace BooksLibrary.Api.Application.Commands.Books;

public class DeleteBookCommandHandler(IBookRepository repository) : IRequestHandler<DeleteBookCommand>
{
    public async Task Handle(DeleteBookCommand request, CancellationToken cancellationToken)
    {
        _ = await repository.GetByIdAsync(request.Id)
            ?? throw new KeyNotFoundException($"Book with id {request.Id} not found.");

        await repository.DeleteAsync(request.Id);
    }
}