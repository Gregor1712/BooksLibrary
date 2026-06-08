namespace Library.Api.Domain;

public class Loan
{
    public long Id { get; set; }

    public long BookId { get; set; }

    public long MemberId { get; set; }

    public DateTimeOffset LoanDate { get; set; }

    public DateTimeOffset DueDate { get; set; }

    public DateTimeOffset? ReturnDate { get; set; }

    public bool IsReturned { get; set; }
}