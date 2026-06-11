using FluentAssertions;
using BooksLibrary.Api.Application.Commands.Books;
using BooksLibrary.Api.Domain;
using NSubstitute;

namespace BooksLibrary.Api.Tests;

public class DeleteBookCommandHandlerTests
{
    private readonly IBookRepository _bookRepository = Substitute.For<IBookRepository>();
    private readonly ILoanRepository _loanRepository = Substitute.For<ILoanRepository>();
    private readonly DeleteBookCommandHandler _handler;

    public DeleteBookCommandHandlerTests()
    {
        _handler = new DeleteBookCommandHandler(_bookRepository, _loanRepository);
    }

    [Fact]
    public async Task Handle_BookHasLoanHistory_ThrowsInvalidOperationAndDoesNotDelete()
    {
        var book = new Book { Id = 5, Title = "Clean Code" };
        _bookRepository.GetByIdAsync(5).Returns(book);
        var loans = new[] { new Loan { Id = 1, BookId = 5 } };
        _loanRepository.GetByBookIdAsync(5).Returns((IEnumerable<Loan>)loans);

        var act = () => _handler.Handle(new DeleteBookCommand(5), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*loan history*");
        await _bookRepository.DidNotReceive().DeleteAsync(Arg.Any<long>());
    }

    [Fact]
    public async Task Handle_BookHasNoLoanHistory_DeletesBook()
    {
        var book = new Book { Id = 7, Title = "The Pragmatic Programmer" };
        _bookRepository.GetByIdAsync(7).Returns(book);
        _loanRepository.GetByBookIdAsync(7).Returns(Enumerable.Empty<Loan>());

        await _handler.Handle(new DeleteBookCommand(7), CancellationToken.None);

        await _bookRepository.Received(1).DeleteAsync(7);
    }
}
