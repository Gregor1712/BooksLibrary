using MediatR;
using System.Text.Json.Serialization;

namespace BooksLibrary.Api.Application.Commands.Members;

public class UpdateMemberCommand : IRequest
{
    [JsonIgnore]
    public long Id { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;
}