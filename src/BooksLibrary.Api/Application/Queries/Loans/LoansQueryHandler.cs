using BooksLibrary.Api.Domain;
using Mapster;
using MediatR;

namespace BooksLibrary.Api.Application.Queries.Loans;

public class LoansQueryHandler(ILoanRepository loanRepository, IBookRepository bookRepository)
    : IRequestHandler<GetLoanQuery, GetLoanQuery.LoanDto?>,
      IRequestHandler<GetAllLoansQuery, IEnumerable<GetAllLoansQuery.LoanListItem>>,
      IRequestHandler<GetDetailAllLoansQuery, IEnumerable<GetDetailAllLoansQuery.LoanDetailListItem>>
{
    public async Task<GetLoanQuery.LoanDto?> Handle(GetLoanQuery request, CancellationToken cancellationToken)
    {
        var loan = await loanRepository.GetByIdAsync(request.Id);
        return loan?.Adapt<GetLoanQuery.LoanDto>();
    }

    public async Task<IEnumerable<GetAllLoansQuery.LoanListItem>> Handle(
        GetAllLoansQuery request,
        CancellationToken cancellationToken)
    {
        var loans = await loanRepository.GetAllAsync();
        return loans.Adapt<IEnumerable<GetAllLoansQuery.LoanListItem>>();
    }

    public async Task<IEnumerable<GetDetailAllLoansQuery.LoanDetailListItem>> Handle(
        GetDetailAllLoansQuery request, CancellationToken cancellationToken)
    {
        var loans = await loanRepository.GetAllAsync();
        var books = await bookRepository.GetAllAsync();
        var booksById = books.ToDictionary(b => b.Id);

        return loans.Select(loan =>
        {
            var item = loan.Adapt<GetDetailAllLoansQuery.LoanDetailListItem>();
            if (booksById.TryGetValue(loan.BookId, out var book))
            {
                item.Book = book;
            }
            return item;
        }).ToList();
    }
}