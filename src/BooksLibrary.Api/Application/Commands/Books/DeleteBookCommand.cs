using MediatR;

namespace BooksLibrary.Api.Application.Commands.Books;

public record DeleteBookCommand(long Id) : IRequest;