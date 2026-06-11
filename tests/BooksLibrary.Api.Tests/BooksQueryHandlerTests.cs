using FluentAssertions;
using BooksLibrary.Api.Application.Queries.Books;
using BooksLibrary.Api.Domain;
using NSubstitute;

namespace BooksLibrary.Api.Tests;

public class BooksQueryHandlerTests
{
    private readonly IBookRepository _bookRepository = Substitute.For<IBookRepository>();
    private readonly BooksQueryHandler _handler;

    public BooksQueryHandlerTests()
    {
        _handler = new BooksQueryHandler(_bookRepository);
    }

    [Fact]
    public async Task Handle_GetAllBooks_MapsCategoryId()
    {
        _bookRepository.GetAllAsync().Returns(new[]
        {
            new Book
            {
                Id = 1,
                Title = "Clean Code",
                Author = "Robert C. Martin",
                ISBN = "9780132350884",
                Year = 2008,
                CategoryId = 3,
                IsAvailable = true,
            },
        });

        var result = await _handler.Handle(new GetAllBooksQuery(), CancellationToken.None);

        var item = result.Single();
        item.CategoryId.Should().Be(3);
        item.Title.Should().Be("Clean Code");
    }
}
