using BooksLibrary.Api.Domain;
using MediatR;

namespace BooksLibrary.Api.Application.Commands.Members;

public class UpdateMemberCommandHandler(IMemberRepository repository) : IRequestHandler<UpdateMemberCommand>
{
    public async Task Handle(UpdateMemberCommand request, CancellationToken cancellationToken)
    {
        var member = await repository.GetByIdAsync(request.Id)
            ?? throw new KeyNotFoundException($"Member with id {request.Id} not found.");

        member.FirstName = request.FirstName;
        member.LastName = request.LastName;
        member.Email = request.Email;

        await repository.UpdateAsync(member);
    }
}