using BooksLibrary.Api.Domain;
using Mapster;
using MediatR;

namespace BooksLibrary.Api.Application.Queries.Loans;

public class LoansQueryHandler(ILoanRepository repository)
    : IRequestHandler<GetLoanQuery, GetLoanQuery.LoanDto?>,
      IRequestHandler<GetAllLoansQuery, IEnumerable<GetAllLoansQuery.LoanListItem>>
{
    public async Task<GetLoanQuery.LoanDto?> Handle(GetLoanQuery request, CancellationToken cancellationToken)
    {
        var loan = await repository.GetByIdAsync(request.Id);
        return loan?.Adapt<GetLoanQuery.LoanDto>();
    }

    public async Task<IEnumerable<GetAllLoansQuery.LoanListItem>> Handle(
        GetAllLoansQuery request,
        CancellationToken cancellationToken)
    {
        var loans = await repository.GetAllAsync();
        return loans.Adapt<IEnumerable<GetAllLoansQuery.LoanListItem>>();
    }
}