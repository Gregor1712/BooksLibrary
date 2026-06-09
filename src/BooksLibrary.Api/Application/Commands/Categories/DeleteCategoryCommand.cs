using MediatR;

namespace BooksLibrary.Api.Application.Commands.Categories;

public record DeleteCategoryCommand(long Id) : IRequest;