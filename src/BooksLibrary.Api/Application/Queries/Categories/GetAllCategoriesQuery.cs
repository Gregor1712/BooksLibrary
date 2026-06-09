using MediatR;

namespace BooksLibrary.Api.Application.Queries.Categories;

public record GetAllCategoriesQuery : IRequest<IEnumerable<GetAllCategoriesQuery.CategoryListItem>>
{
    public class CategoryListItem
    {
        public long Id { get; set; }

        public string Name { get; set; } = string.Empty;
    }
}