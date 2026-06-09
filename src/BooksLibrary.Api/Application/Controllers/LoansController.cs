using BooksLibrary.Api.Application.Commands.Loans;
using BooksLibrary.Api.Application.Queries.Loans;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace BooksLibrary.Api.Application.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LoansController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GetAllLoansQuery.LoanListItem>>> GetAll()
        => Ok(await mediator.Send(new GetAllLoansQuery()));

    [HttpGet("{id}", Name = nameof(GetLoan))]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GetLoanQuery.LoanDto>> GetLoan(long id)
    {
        var loan = await mediator.Send(new GetLoanQuery(id));
        return loan is null ? NotFound() : Ok(loan);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> Create(CreateLoanCommand command)
    {
        var id = await mediator.Send(command);
        return CreatedAtRoute(nameof(GetLoan), new { id }, id);
    }

    [HttpPut("{id}/return")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> ReturnBook(long id)
    {
        await mediator.Send(new ReturnBookCommand(id));
        return Ok();
    }
}