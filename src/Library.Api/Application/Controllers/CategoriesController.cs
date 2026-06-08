using Library.Api.Application.Commands.Categories;
using Library.Api.Application.Queries.Categories;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Library.Api.Application.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GetAllCategoriesQuery.CategoryListItem>>> GetAll()
        => Ok(await mediator.Send(new GetAllCategoriesQuery()));

    [HttpGet("{id}", Name = nameof(GetCategory))]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GetCategoryQuery.CategoryDto>> GetCategory(long id)
    {
        var category = await mediator.Send(new GetCategoryQuery(id));
        return category is null ? NotFound() : Ok(category);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> Create(CreateCategoryCommand command)
    {
        var id = await mediator.Send(command);
        return CreatedAtRoute(nameof(GetCategory), new { id }, id);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> Update(long id, UpdateCategoryCommand command)
    {
        command.Id = id;
        await mediator.Send(command);
        return Ok();
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Delete(long id)
    {
        await mediator.Send(new DeleteCategoryCommand(id));
        return NoContent();
    }
}