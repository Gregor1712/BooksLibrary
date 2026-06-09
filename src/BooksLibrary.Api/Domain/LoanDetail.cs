namespace BooksLibrary.Api.Domain;

public class LoanDetail
{
    public long Id { get; set; }

    public long BookId { get; set; }

    public long MemberId { get; set; }

    public DateTimeOffset LoanDate { get; set; }

    public DateTimeOffset DueDate { get; set; }

    public DateTimeOffset? ReturnDate { get; set; }

    public bool IsReturned { get; set; }

    public Book Book { get; set; } = null!;
}