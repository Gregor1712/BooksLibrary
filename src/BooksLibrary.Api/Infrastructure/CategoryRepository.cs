using Kros.KORM;
using BooksLibrary.Api.Domain;

namespace BooksLibrary.Api.Infrastructure;

public class CategoryRepository : ICategoryRepository
{
    private readonly IDatabase _database;

    public CategoryRepository(IDatabase database)
    {
        _database = database;
    }

    public async Task<long> CreateAsync(Category category)
    {
        await _database.AddAsync(category);
        return category.Id;
    }

    public Task<Category?> GetByIdAsync(long id)
    {
        var category = _database.Query<Category>()
            .FirstOrDefault(c => c.Id == id);
        return Task.FromResult(category);
    }

    public Task<IEnumerable<Category>> GetAllAsync()
    {
        var categories = _database.Query<Category>().AsEnumerable();
        return Task.FromResult(categories);
    }

    public Task UpdateAsync(Category category)
        => _database.EditAsync(category);

    public Task DeleteAsync(long id)
        => _database.DeleteAsync<Category>(id);
}
