import { LoanDetail } from '../../core/models/loan';
import { Member } from '../../core/models/member';
import { selectAvailableBookOptions, selectLoansVm } from './loans.selectors';

describe('loans selectors', () => {
  const member: Member = { id: 2, firstName: 'Jana', lastName: 'Novakova', email: 'jana@example.com' };

  const activeLoan: LoanDetail = {
    id: 7, bookId: 1, memberId: 2,
    loanDate: '2026-06-01T00:00:00+00:00', dueDate: '2026-06-15T00:00:00+00:00',
    isReturned: false, isOverdue: false,
    book: { id: 1, title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', year: 2008, categoryId: 3, isAvailable: false },
  };

  const returnedLoan: LoanDetail = { ...activeLoan, id: 8, isReturned: true };
  const overdueLoan: LoanDetail = { ...activeLoan, id: 9, isOverdue: true };

  it('joins member name and computes status', () => {
    const vm = selectLoansVm.projector([activeLoan, overdueLoan], [member], false);
    expect(vm[0]).toEqual(jasmine.objectContaining({
      id: 7, bookTitle: 'Clean Code', memberName: 'Jana Novakova', status: 'Active',
    }));
    expect(vm[1].status).toBe('Overdue');
  });

  it('hides returned loans when showReturned is false', () => {
    const vm = selectLoansVm.projector([activeLoan, returnedLoan], [member], false);
    expect(vm.length).toBe(1);
    expect(vm[0].id).toBe(7);
  });

  it('includes returned loans when showReturned is true', () => {
    const vm = selectLoansVm.projector([activeLoan, returnedLoan], [member], true);
    expect(vm.length).toBe(2);
    expect(vm[1].status).toBe('Returned');
  });

  it('falls back to ids when lookups are missing', () => {
    const vm = selectLoansVm.projector([{ ...activeLoan, book: null }], [], false);
    expect(vm[0].bookTitle).toBe('#1');
    expect(vm[0].memberName).toBe('#2');
  });

  it('selectAvailableBookOptions filters to available books', () => {
    const books = [
      { id: 1, title: 'A', author: '', isbn: '', year: 2000, categoryId: 1, isAvailable: true },
      { id: 2, title: 'B', author: '', isbn: '', year: 2000, categoryId: 1, isAvailable: false },
    ];
    const options = selectAvailableBookOptions.projector(books);
    expect(options.map(b => b.id)).toEqual([1]);
  });
});
