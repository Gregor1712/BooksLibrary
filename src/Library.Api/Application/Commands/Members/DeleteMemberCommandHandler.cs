using Library.Api.Domain;
using MediatR;

namespace Library.Api.Application.Commands.Members;

public class DeleteMemberCommandHandler(IMemberRepository repository) : IRequestHandler<DeleteMemberCommand>
{
    public async Task Handle(DeleteMemberCommand request, CancellationToken cancellationToken)
    {
        _ = await repository.GetByIdAsync(request.Id)
            ?? throw new KeyNotFoundException($"Member with id {request.Id} not found.");

        await repository.DeleteAsync(request.Id);
    }
}