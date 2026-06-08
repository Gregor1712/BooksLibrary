using Library.Api.Domain;
using System.Collections.Concurrent;

namespace Library.Api.Infrastructure;

public class InMemoryMemberRepository : IMemberRepository
{
    private readonly ConcurrentDictionary<long, Member> _members = new();
    private long _nextId = 1;

    public Task<long> CreateAsync(Member member)
    {
        member.Id = Interlocked.Increment(ref _nextId);
        _members[member.Id] = member;
        return Task.FromResult(member.Id);
    }

    public Task<Member?> GetByIdAsync(long id)
        => Task.FromResult(_members.GetValueOrDefault(id));

    public Task<IEnumerable<Member>> GetAllAsync()
        => Task.FromResult<IEnumerable<Member>>(_members.Values.ToList());

    public Task UpdateAsync(Member member)
    {
        _members[member.Id] = member;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(long id)
    {
        _members.TryRemove(id, out _);
        return Task.CompletedTask;
    }
}