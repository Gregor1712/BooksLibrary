using MediatR;

namespace Library.Api.Application.Commands.Loans;

public record ReturnBookCommand(long LoanId) : IRequest;