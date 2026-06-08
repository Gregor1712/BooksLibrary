using Library.Api.Application.Commands.Books;
using Library.Api.Application.Queries.Books;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Library.Api.Application.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GetAllBooksQuery.BookListItem>>> GetAll()
        => Ok(await mediator.Send(new GetAllBooksQuery()));

    [HttpGet("{id}", Name = nameof(GetBook))]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GetBookQuery.BookDto>> GetBook(long id)
    {
        var book = await mediator.Send(new GetBookQuery(id));
        return book is null ? NotFound() : Ok(book);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> Create(CreateBookCommand command)
    {
        var id = await mediator.Send(command);
        return CreatedAtRoute(nameof(GetBook), new { id }, id);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> Update(long id, UpdateBookCommand command)
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
        await mediator.Send(new DeleteBookCommand(id));
        return NoContent();
    }
}