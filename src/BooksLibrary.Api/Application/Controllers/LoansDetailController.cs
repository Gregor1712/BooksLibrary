namespace BooksLibrary.Api.Application.Controllers;
using BooksLibrary.Api.Application.Commands.Loans;
using BooksLibrary.Api.Application.Queries.Loans;
using MediatR;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class LoansDetailController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GetDetailAllLoansQuery.LoanDetailListItem>>> GetDetailAll()
        => Ok(await mediator.Send(new GetDetailAllLoansQuery()));
}