using BooksLibrary.Api.Domain;
using Mapster;
using MediatR;

namespace BooksLibrary.Api.Application.Commands.Categories;

public class CreateCategoryCommandHandler(ICategoryRepository repository) : IRequestHandler<CreateCategoryCommand, long>
{
    public async Task<long> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = request.Adapt<Category>();
        return await repository.CreateAsync(category);
    }
}