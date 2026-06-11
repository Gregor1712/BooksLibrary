import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BooksApiService } from './books-api.service';
import { Book } from '../models/book';

describe('BooksApiService', () => {
  let service: BooksApiService;
  let httpMock: HttpTestingController;

  const book: Book = {
    id: 1, title: 'Clean Code', author: 'Robert C. Martin',
    isbn: '9780132350884', year: 2008, categoryId: 3, isAvailable: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(BooksApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll issues GET /api/Books', () => {
    service.getAll().subscribe(result => expect(result).toEqual([book]));
    const req = httpMock.expectOne('/api/Books');
    expect(req.request.method).toBe('GET');
    req.flush([book]);
  });

  it('create issues POST /api/Books with the payload', () => {
    const payload = { title: 'T', author: 'A', isbn: 'I', year: 2000, categoryId: 1 };
    service.create(payload).subscribe(id => expect(id).toBe(10));
    const req = httpMock.expectOne('/api/Books');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(10);
  });

  it('update issues PUT /api/Books/:id', () => {
    service.update(5, { title: 'T', author: 'A', isbn: 'I', year: 2000, categoryId: 1 }).subscribe();
    const req = httpMock.expectOne('/api/Books/5');
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  it('delete issues DELETE /api/Books/:id', () => {
    service.delete(5).subscribe();
    const req = httpMock.expectOne('/api/Books/5');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});