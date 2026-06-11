using BooksLibrary.Api.Domain;
using MediatR;

namespace BooksLibrary.Api.Application.Commands.Books;

public class DeleteBookCommandHandler(IBookRepository repository, ILoanRepository loanRepository)
    : IRequestHandler<DeleteBookCommand>
{
    public async Task Handle(DeleteBookCommand request, CancellationToken cancellationToken)
    {
        var book = await repository.GetByIdAsync(request.Id)
            ?? throw new KeyNotFoundException($"Book with id {request.Id} not found.");

        var loans = await loanRepository.GetByBookIdAsync(request.Id);
        if (loans.Any())
        {
            throw new InvalidOperationException(
                $"Book '{book.Title}' cannot be deleted because it has loan history.");
        }

        await repository.DeleteAsync(request.Id);
    }
}
