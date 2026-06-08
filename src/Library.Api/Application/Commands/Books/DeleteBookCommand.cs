using MediatR;

namespace Library.Api.Application.Commands.Books;

public record DeleteBookCommand(long Id) : IRequest;