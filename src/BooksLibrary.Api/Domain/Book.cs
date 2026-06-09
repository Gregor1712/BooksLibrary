namespace BooksLibrary.Api.Domain;

public class Book
{
    public long Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Author { get; set; } = string.Empty;

    public string ISBN { get; set; } = string.Empty;

    public int Year { get; set; }

    public long CategoryId { get; set; }

    public bool IsAvailable { get; set; } = true;

    public DateTimeOffset Created { get; set; }

    public DateTimeOffset LastChange { get; set; }
}