namespace Library.Api.Domain;

public interface IMemberRepository
{
    Task<long> CreateAsync(Member member);

    Task<Member?> GetByIdAsync(long id);

    Task<IEnumerable<Member>> GetAllAsync();

    Task UpdateAsync(Member member);

    Task DeleteAsync(long id);
}