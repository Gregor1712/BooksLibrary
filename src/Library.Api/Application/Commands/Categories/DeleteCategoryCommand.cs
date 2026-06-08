using MediatR;

namespace Library.Api.Application.Commands.Categories;

public record DeleteCategoryCommand(long Id) : IRequest;