using Library.Api.Domain;
using System.Collections.Concurrent;

namespace Library.Api.Infrastructure;

public class InMemoryLoanRepository : ILoanRepository
{
    private readonly ConcurrentDictionary<long, Loan> _loans = new();
    private long _nextId = 1;

    public Task<long> CreateAsync(Loan loan)
    {
        loan.Id = Interlocked.Increment(ref _nextId);
        _loans[loan.Id] = loan;
        return Task.FromResult(loan.Id);
    }

    public Task<Loan?> GetByIdAsync(long id)
        => Task.FromResult(_loans.GetValueOrDefault(id));

    public Task<IEnumerable<Loan>> GetAllAsync()
        => Task.FromResult<IEnumerable<Loan>>(_loans.Values.ToList());

    public Task<IEnumerable<Loan>> GetActiveByMemberIdAsync(long memberId)
        => Task.FromResult<IEnumerable<Loan>>(
            _loans.Values.Where(l => l.MemberId == memberId && !l.IsReturned).ToList());

    public Task<Loan?> GetActiveByBookIdAsync(long bookId)
        => Task.FromResult(_loans.Values.FirstOrDefault(l => l.BookId == bookId && !l.IsReturned));

    public Task UpdateAsync(Loan loan)
    {
        _loans[loan.Id] = loan;
        return Task.CompletedTask;
    }
}