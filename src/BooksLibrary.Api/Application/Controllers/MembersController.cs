using BooksLibrary.Api.Application.Commands.Members;
using BooksLibrary.Api.Application.Queries.Members;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace BooksLibrary.Api.Application.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MembersController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GetAllMembersQuery.MemberListItem>>> GetAll()
        => Ok(await mediator.Send(new GetAllMembersQuery()));

    [HttpGet("{id}", Name = nameof(GetMember))]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GetMemberQuery.MemberDto>> GetMember(long id)
    {
        var member = await mediator.Send(new GetMemberQuery(id));
        return member is null ? NotFound() : Ok(member);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> Create(CreateMemberCommand command)
    {
        var id = await mediator.Send(command);
        return CreatedAtRoute(nameof(GetMember), new { id }, id);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> Update(long id, UpdateMemberCommand command)
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
        await mediator.Send(new DeleteMemberCommand(id));
        return NoContent();
    }
}