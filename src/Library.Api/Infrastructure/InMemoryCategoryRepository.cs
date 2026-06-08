using Library.Api.Domain;
using System.Collections.Concurrent;

namespace Library.Api.Infrastructure;

public class InMemoryCategoryRepository : ICategoryRepository
{
    private readonly ConcurrentDictionary<long, Category> _categories = new();
    private long _nextId = 1;

    public Task<long> CreateAsync(Category category)
    {
        category.Id = Interlocked.Increment(ref _nextId);
        _categories[category.Id] = category;
        return Task.FromResult(category.Id);
    }

    public Task<Category?> GetByIdAsync(long id)
        => Task.FromResult(_categories.GetValueOrDefault(id));

    public Task<IEnumerable<Category>> GetAllAsync()
        => Task.FromResult<IEnumerable<Category>>(_categories.Values.ToList());

    public Task UpdateAsync(Category category)
    {
        _categories[category.Id] = category;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(long id)
    {
        _categories.TryRemove(id, out _);
        return Task.CompletedTask;
    }
}