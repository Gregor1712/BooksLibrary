using Library.Api.Domain;
using Mapster;
using MediatR;

namespace Library.Api.Application.Queries.Categories;

public class CategoriesQueryHandler(ICategoryRepository repository)
    : IRequestHandler<GetCategoryQuery, GetCategoryQuery.CategoryDto?>,
      IRequestHandler<GetAllCategoriesQuery, IEnumerable<GetAllCategoriesQuery.CategoryListItem>>
{
    public async Task<GetCategoryQuery.CategoryDto?> Handle(GetCategoryQuery request, CancellationToken cancellationToken)
    {
        var category = await repository.GetByIdAsync(request.Id);
        return category?.Adapt<GetCategoryQuery.CategoryDto>();
    }

    public async Task<IEnumerable<GetAllCategoriesQuery.CategoryListItem>> Handle(
        GetAllCategoriesQuery request,
        CancellationToken cancellationToken)
    {
        var categories = await repository.GetAllAsync();
        return categories.Adapt<IEnumerable<GetAllCategoriesQuery.CategoryListItem>>();
    }
}