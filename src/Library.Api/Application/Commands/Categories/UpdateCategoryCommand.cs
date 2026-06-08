using MediatR;
using System.Text.Json.Serialization;

namespace Library.Api.Application.Commands.Categories;

public class UpdateCategoryCommand : IRequest
{
    [JsonIgnore]
    public long Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
}