using Kros.KORM;
using Library.Api.Domain;

namespace Library.Api.Infrastructure;

public class BookRepository : IBookRepository
{
    private readonly IDatabase _database;

    public BookRepository(IDatabase database)
    {
        _database = database;
    }

    public async Task<long> CreateAsync(Book book)
    {
        await _database.AddAsync(book);
        return book.Id;
    }

    public Task<Book?> GetByIdAsync(long id)
    {
        var book = _database.Query<Book>()
            .FirstOrDefault(b => b.Id == id);
        return Task.FromResult(book);
    }

    public Task<IEnumerable<Book>> GetAllAsync()
    {
        var books = _database.Query<Book>().AsEnumerable();
        return Task.FromResult(books);
    }

    public Task UpdateAsync(Book book)
        => _database.EditAsync(book);

    public Task DeleteAsync(long id)
        => _database.DeleteAsync<Book>(id);
}
