using MediatR;

namespace Library.Api.Application.Commands.Members;

public record DeleteMemberCommand(long Id) : IRequest;