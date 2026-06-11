using BooksLibrary.Api.Application.Queries.Books;
using BooksLibrary.Api.Domain;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace BooksLibrary.Api.Tests;

public class BooksQueryHandlerTests
{
    [Fact]
    public async Task Handle_GetAllBooks_MapsCategoryId()
    {
        var repository = Substitute.For<IBookRepository>();
        repository.GetAllAsync().Returns(new[]
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
        var handler = new BooksQueryHandler(repository);

        var result = await handler.Handle(new GetAllBooksQuery(), CancellationToken.None);

        var item = result.Single();
        item.CategoryId.Should().Be(3);
        item.Title.Should().Be("Clean Code");
    }
}
