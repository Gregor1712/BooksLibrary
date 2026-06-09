using MediatR;

namespace BooksLibrary.Api.Application.Commands.Loans;

public record ReturnBookCommand(long LoanId) : IRequest;