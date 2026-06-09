namespace BooksLibrary.Api.Domain;

public interface IBookRepository
{
    Task<long> CreateAsync(Book book);

    Task<Book?> GetByIdAsync(long id);

    Task<IEnumerable<Book>> GetAllAsync();

    Task UpdateAsync(Book book);

    Task DeleteAsync(long id);
}