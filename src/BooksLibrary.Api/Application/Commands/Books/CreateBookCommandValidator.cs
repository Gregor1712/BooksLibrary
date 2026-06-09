using FluentValidation;

namespace BooksLibrary.Api.Application.Commands.Books;

public class CreateBookCommandValidator : AbstractValidator<CreateBookCommand>
{
    public CreateBookCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Author)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.ISBN)
            .NotEmpty()
            .MaximumLength(13);

        RuleFor(x => x.Year)
            .GreaterThan(0)
            .LessThanOrEqualTo(DateTime.Now.Year);

        RuleFor(x => x.CategoryId)
            .GreaterThan(0);
    }
}