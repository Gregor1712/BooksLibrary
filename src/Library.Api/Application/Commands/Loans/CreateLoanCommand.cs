using MediatR;

namespace Library.Api.Application.Commands.Loans;

public class CreateLoanCommand : IRequest<long>
{
    public long BookId { get; set; }

    public long MemberId { get; set; }
}