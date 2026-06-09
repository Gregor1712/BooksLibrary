using MediatR;

namespace BooksLibrary.Api.Application.Queries.Members;

public record GetMemberQuery(long Id) : IRequest<GetMemberQuery.MemberDto?>
{
    public class MemberDto
    {
        public long Id { get; set; }

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;
    }
}