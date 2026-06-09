using MediatR;

namespace BooksLibrary.Api.Application.Commands.Members;

public record DeleteMemberCommand(long Id) : IRequest;