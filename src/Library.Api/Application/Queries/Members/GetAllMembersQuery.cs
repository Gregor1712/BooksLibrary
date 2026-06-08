using MediatR;

namespace Library.Api.Application.Queries.Members;

public record GetAllMembersQuery : IRequest<IEnumerable<GetAllMembersQuery.MemberListItem>>
{
    public class MemberListItem
    {
        public long Id { get; set; }

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;
    }
}