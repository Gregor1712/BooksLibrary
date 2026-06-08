using MediatR;

namespace Library.Api.Application.Queries.Loans;

public record GetAllLoansQuery : IRequest<IEnumerable<GetAllLoansQuery.LoanListItem>>
{
    public class LoanListItem
    {
        public long Id { get; set; }

        public long BookId { get; set; }

        public long MemberId { get; set; }

        public DateTimeOffset LoanDate { get; set; }

        public DateTimeOffset DueDate { get; set; }

        public bool IsReturned { get; set; }

        public bool IsOverdue => !IsReturned && DueDate < DateTimeOffset.Now;
    }
}