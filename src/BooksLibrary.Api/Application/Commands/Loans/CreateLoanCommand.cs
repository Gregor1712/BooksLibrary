using MediatR;

namespace BooksLibrary.Api.Application.Commands.Loans;

public class CreateLoanCommand : IRequest<long>
{
    public long BookId { get; set; }

    public long MemberId { get; set; }
}