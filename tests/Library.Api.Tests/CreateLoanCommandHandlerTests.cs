using FluentAssertions;
using Library.Api.Application.Commands.Loans;
using Library.Api.Domain;
using NSubstitute;

namespace Library.Api.Tests;

public class CreateLoanCommandHandlerTests
{
    private readonly ILoanRepository _loanRepository = Substitute.For<ILoanRepository>();
    private readonly IBookRepository _bookRepository = Substitute.For<IBookRepository>();
    private readonly CreateLoanCommandHandler _handler;

    public CreateLoanCommandHandlerTests()
    {
        _handler = new CreateLoanCommandHandler(_loanRepository, _bookRepository);
    }

    [Fact]
    public async Task Handle_BookAvailable_CreatesLoan()
    {
        var book = new Book { Id = 1, Title = "Test Book", IsAvailable = true };
        _bookRepository.GetByIdAsync(1).Returns(book);
        _loanRepository.GetActiveByMemberIdAsync(1).Returns(Enumerable.Empty<Loan>());
        _loanRepository.CreateAsync(Arg.Any<Loan>()).Returns(42L);

        var result = await _handler.Handle(new CreateLoanCommand { BookId = 1, MemberId = 1 }, CancellationToken.None);

        result.Should().Be(42);
        book.IsAvailable.Should().BeFalse();
        await _loanRepository.Received(1).CreateAsync(Arg.Any<Loan>());
    }

    [Fact]
    public async Task Handle_BookNotAvailable_ThrowsInvalidOperation()
    {
        var book = new Book { Id = 1, Title = "Test Book", IsAvailable = false };
        _bookRepository.GetByIdAsync(1).Returns(book);

        var act = () => _handler.Handle(new CreateLoanCommand { BookId = 1, MemberId = 1 }, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not available*");
    }

    [Fact]
    public async Task Handle_MemberHas5ActiveLoans_ThrowsInvalidOperation()
    {
        var book = new Book { Id = 1, Title = "Test Book", IsAvailable = true };
        _bookRepository.GetByIdAsync(1).Returns(book);

        var activeLoans = Enumerable.Range(1, 5).Select(i => new Loan { Id = i, MemberId = 1 });
        _loanRepository.GetActiveByMemberIdAsync(1).Returns(activeLoans);

        var act = () => _handler.Handle(new CreateLoanCommand { BookId = 1, MemberId = 1 }, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*maximum*");
    }

    [Fact]
    public async Task Handle_BookNotFound_ThrowsKeyNotFound()
    {
        _bookRepository.GetByIdAsync(99).Returns((Book?)null);

        var act = () => _handler.Handle(new CreateLoanCommand { BookId = 99, MemberId = 1 }, CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }
}