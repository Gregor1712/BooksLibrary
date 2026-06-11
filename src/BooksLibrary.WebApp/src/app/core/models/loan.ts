import { Book } from './book';

export interface LoanDetail {
  id: number;
  bookId: number;
  memberId: number;
  loanDate: string;
  dueDate: string;
  isReturned: boolean;
  isOverdue: boolean;
  book: Book | null;
}

export interface CreateLoanRequest {
  bookId: number;
  memberId: number;
}