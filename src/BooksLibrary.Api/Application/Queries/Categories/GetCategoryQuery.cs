using MediatR;

namespace BooksLibrary.Api.Application.Queries.Categories;

public record GetCategoryQuery(long Id) : IRequest<GetCategoryQuery.CategoryDto?>
{
    public class CategoryDto
    {
        public long Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
    }
}