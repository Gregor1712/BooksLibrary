using BooksLibrary.Api.Domain;
using MediatR;

namespace BooksLibrary.Api.Application.Commands.Categories;

public class UpdateCategoryCommandHandler(ICategoryRepository repository) : IRequestHandler<UpdateCategoryCommand>
{
    public async Task Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await repository.GetByIdAsync(request.Id)
            ?? throw new KeyNotFoundException($"Category with id {request.Id} not found.");

        category.Name = request.Name;
        category.Description = request.Description;

        await repository.UpdateAsync(category);
    }
}