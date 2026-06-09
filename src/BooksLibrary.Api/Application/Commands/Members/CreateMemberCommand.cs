using MediatR;

namespace BooksLibrary.Api.Application.Commands.Members;

public class CreateMemberCommand : IRequest<long>
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;
}