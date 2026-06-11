export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  year: number;
  categoryId: number;
  isAvailable: boolean;
}

export interface SaveBookRequest {
  title: string;
  author: string;
  isbn: string;
  year: number;
  categoryId: number;
}