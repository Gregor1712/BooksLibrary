using MediatR;

namespace Library.Api.Application.Queries.Loans;

public record GetLoanQuery(long Id) : IRequest<GetLoanQuery.LoanDto?>
{
    public class LoanDto
    {
        public long Id { get; set; }

        public long BookId { get; set; }

        public long MemberId { get; set; }

        public DateTimeOffset LoanDate { get; set; }

        public DateTimeOffset DueDate { get; set; }

        public DateTimeOffset? ReturnDate { get; set; }

        public bool IsReturned { get; set; }

        public bool IsOverdue => !IsReturned && DueDate < DateTimeOffset.Now;
    }
}