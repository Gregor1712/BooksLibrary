using FluentValidation;

namespace Library.Api.Application.Commands.Loans;

public class CreateLoanCommandValidator : AbstractValidator<CreateLoanCommand>
{
    public CreateLoanCommandValidator()
    {
        RuleFor(x => x.BookId).GreaterThan(0);
        RuleFor(x => x.MemberId).GreaterThan(0);
    }
}