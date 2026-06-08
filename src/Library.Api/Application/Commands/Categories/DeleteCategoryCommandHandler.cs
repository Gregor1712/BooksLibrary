using Library.Api.Domain;
using MediatR;

namespace Library.Api.Application.Commands.Categories;

public class DeleteCategoryCommandHandler(ICategoryRepository repository) : IRequestHandler<DeleteCategoryCommand>
{
    public async Task Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        _ = await repository.GetByIdAsync(request.Id)
            ?? throw new KeyNotFoundException($"Category with id {request.Id} not found.");

        await repository.DeleteAsync(request.Id);
    }
}