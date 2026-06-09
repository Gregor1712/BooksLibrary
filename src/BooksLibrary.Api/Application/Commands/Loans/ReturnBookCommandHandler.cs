using BooksLibrary.Api.Domain;
using MediatR;

namespace BooksLibrary.Api.Application.Commands.Loans;

public class ReturnBookCommandHandler(
    ILoanRepository loanRepository,
    IBookRepository bookRepository) : IRequestHandler<ReturnBookCommand>
{
    public async Task Handle(ReturnBookCommand request, CancellationToken cancellationToken)
    {
        var loan = await loanRepository.GetByIdAsync(request.LoanId)
            ?? throw new KeyNotFoundException($"Loan with id {request.LoanId} not found.");

        if (loan.IsReturned)
            throw new InvalidOperationException("This book has already been returned.");

        loan.IsReturned = true;
        loan.ReturnDate = DateTimeOffset.Now;
        await loanRepository.UpdateAsync(loan);

        var book = await bookRepository.GetByIdAsync(loan.BookId);
        if (book is not null)
        {
            book.IsAvailable = true;
            book.LastChange = DateTimeOffset.Now;
            await bookRepository.UpdateAsync(book);
        }
    }
}