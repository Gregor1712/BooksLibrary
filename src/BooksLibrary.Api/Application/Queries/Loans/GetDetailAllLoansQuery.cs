using BooksLibrary.Api.Domain;
using MediatR;

public record GetDetailAllLoansQuery : IRequest<IEnumerable<GetDetailAllLoansQuery.LoanDetailListItem>>
{
    public class LoanDetailListItem
    {
        public long Id { get; set; }

        public long BookId { get; set; }

        public long MemberId { get; set; }

        public DateTimeOffset LoanDate { get; set; }

        public DateTimeOffset DueDate { get; set; }

        public bool IsReturned { get; set; }

        public bool IsOverdue => !IsReturned && DueDate < DateTimeOffset.Now;

        public Book Book { get; set; } = null!;
    }
}