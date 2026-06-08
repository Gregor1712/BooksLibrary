namespace Library.Api.Domain;

public interface ICategoryRepository
{
    Task<long> CreateAsync(Category category);

    Task<Category?> GetByIdAsync(long id);

    Task<IEnumerable<Category>> GetAllAsync();

    Task UpdateAsync(Category category);

    Task DeleteAsync(long id);
}