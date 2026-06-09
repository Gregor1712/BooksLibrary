using Kros.KORM;
using BooksLibrary.Api.Domain;

namespace BooksLibrary.Api.Infrastructure;

public class LoanRepository : ILoanRepository
{
    private readonly IDatabase _database;

    public LoanRepository(IDatabase database)
    {
        _database = database;
    }

    public async Task<long> CreateAsync(Loan loan)
    {
        await _database.AddAsync(loan);
        return loan.Id;
    }

    public Task<Loan?> GetByIdAsync(long id)
    {
        var loan = _database.Query<Loan>()
            .FirstOrDefault(l => l.Id == id);
        return Task.FromResult(loan);
    }

    public Task<IEnumerable<Loan>> GetAllAsync()
    {
        var loans = _database.Query<Loan>().AsEnumerable();
        return Task.FromResult(loans);
    }

    public Task<IEnumerable<Loan>> GetActiveByMemberIdAsync(long memberId)
    {
        var loans = _database.Query<Loan>()
            .Where(l => l.MemberId == memberId && !l.IsReturned)
            .AsEnumerable();
        return Task.FromResult(loans);
    }

    public Task<Loan?> GetActiveByBookIdAsync(long bookId)
    {
        var loan = _database.Query<Loan>()
            .FirstOrDefault(l => l.BookId == bookId && !l.IsReturned);
        return Task.FromResult(loan);
    }

    public Task UpdateAsync(Loan loan)
        => _database.EditAsync(loan);
}
