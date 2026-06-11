namespace BooksLibrary.Api.Domain;

public interface ILoanRepository
{
    Task<long> CreateAsync(Loan loan);

    Task<Loan?> GetByIdAsync(long id);

    Task<IEnumerable<Loan>> GetAllAsync();

    Task<IEnumerable<Loan>> GetActiveByMemberIdAsync(long memberId);

    Task<Loan?> GetActiveByBookIdAsync(long bookId);

    Task UpdateAsync(Loan loan);

    Task<IEnumerable<Loan>> GetByBookIdAsync(long bookId);
}