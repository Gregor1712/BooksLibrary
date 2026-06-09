using BooksLibrary.Api.Domain;
using Mapster;
using MediatR;

namespace BooksLibrary.Api.Application.Commands.Members;

public class CreateMemberCommandHandler(IMemberRepository repository) : IRequestHandler<CreateMemberCommand, long>
{
    public async Task<long> Handle(CreateMemberCommand request, CancellationToken cancellationToken)
    {
        var member = request.Adapt<Member>();
        return await repository.CreateAsync(member);
    }
}