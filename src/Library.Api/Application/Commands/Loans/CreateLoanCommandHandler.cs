using Library.Api.Domain;
using MediatR;

namespace Library.Api.Application.Commands.Loans;

public class CreateLoanCommandHandler(
    ILoanRepository loanRepository,
    IBookRepository bookRepository) : IRequestHandler<CreateLoanCommand, long>
{
    private const int MaxActiveLoansPerMember = 5;
    private const int DefaultLoanDays = 14;

    public async Task<long> Handle(CreateLoanCommand request, CancellationToken cancellationToken)
    {
        var book = await bookRepository.GetByIdAsync(request.BookId)
            ?? throw new KeyNotFoundException($"Book with id {request.BookId} not found.");

        if (!book.IsAvailable)
            throw new InvalidOperationException($"Book '{book.Title}' is not available for loan.");

        var activeLoans = await loanRepository.GetActiveByMemberIdAsync(request.MemberId);
        if (activeLoans.Count() >= MaxActiveLoansPerMember)
            throw new InvalidOperationException($"Member has reached the maximum of {MaxActiveLoansPerMember} active loans.");

        var loan = new Loan
        {
            BookId = request.BookId,
            MemberId = request.MemberId,
            LoanDate = DateTimeOffset.Now,
            DueDate = DateTimeOffset.Now.AddDays(DefaultLoanDays),
            IsReturned = false
        };

        var id = await loanRepository.CreateAsync(loan);

        book.IsAvailable = false;
        book.LastChange = DateTimeOffset.Now;
        await bookRepository.UpdateAsync(book);

        return id;
    }
}