using Kros.KORM;
using Library.Api.Domain;

namespace Library.Api.Infrastructure;

public class MemberRepository : IMemberRepository
{
    private readonly IDatabase _database;

    public MemberRepository(IDatabase database)
    {
        _database = database;
    }

    public async Task<long> CreateAsync(Member member)
    {
        await _database.AddAsync(member);
        return member.Id;
    }

    public Task<Member?> GetByIdAsync(long id)
    {
        var member = _database.Query<Member>()
            .FirstOrDefault(m => m.Id == id);
        return Task.FromResult(member);
    }

    public Task<IEnumerable<Member>> GetAllAsync()
    {
        var members = _database.Query<Member>().AsEnumerable();
        return Task.FromResult(members);
    }

    public Task UpdateAsync(Member member)
        => _database.EditAsync(member);

    public Task DeleteAsync(long id)
        => _database.DeleteAsync<Member>(id);
}
