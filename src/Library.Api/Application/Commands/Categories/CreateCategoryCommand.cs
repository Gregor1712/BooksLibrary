using MediatR;

namespace Library.Api.Application.Commands.Categories;

public class CreateCategoryCommand : IRequest<long>
{
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
}