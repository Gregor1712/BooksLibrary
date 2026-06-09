using BooksLibrary.Api.Domain;
using Mapster;
using MediatR;

namespace BooksLibrary.Api.Application.Queries.Members;

public class MembersQueryHandler(IMemberRepository repository)
    : IRequestHandler<GetMemberQuery, GetMemberQuery.MemberDto?>,
      IRequestHandler<GetAllMembersQuery, IEnumerable<GetAllMembersQuery.MemberListItem>>
{
    public async Task<GetMemberQuery.MemberDto?> Handle(GetMemberQuery request, CancellationToken cancellationToken)
    {
        var member = await repository.GetByIdAsync(request.Id);
        return member?.Adapt<GetMemberQuery.MemberDto>();
    }

    public async Task<IEnumerable<GetAllMembersQuery.MemberListItem>> Handle(
        GetAllMembersQuery request,
        CancellationToken cancellationToken)
    {
        var members = await repository.GetAllAsync();
        return members.Adapt<IEnumerable<GetAllMembersQuery.MemberListItem>>();
    }
}