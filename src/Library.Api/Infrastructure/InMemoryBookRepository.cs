using Library.Api.Domain;
using System.Collections.Concurrent;

namespace Library.Api.Infrastructure;

public class InMemoryBookRepository : IBookRepository
{
    private readonly ConcurrentDictionary<long, Book> _books = new();
    private long _nextId = 1;

    public Task<long> CreateAsync(Book book)
    {
        book.Id = Interlocked.Increment(ref _nextId);
        _books[book.Id] = book;
        return Task.FromResult(book.Id);
    }

    public Task<Book?> GetByIdAsync(long id)
        => Task.FromResult(_books.GetValueOrDefault(id));

    public Task<IEnumerable<Book>> GetAllAsync()
        => Task.FromResult<IEnumerable<Book>>(_books.Values.ToList());

    public Task UpdateAsync(Book book)
    {
        _books[book.Id] = book;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(long id)
    {
        _books.TryRemove(id, out _);
        return Task.CompletedTask;
    }
}