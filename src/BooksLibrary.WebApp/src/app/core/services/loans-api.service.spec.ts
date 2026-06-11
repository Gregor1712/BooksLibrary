import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LoansApiService } from './loans-api.service';

describe('LoansApiService', () => {
  let service: LoansApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(LoansApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getDetailAll issues GET /api/LoansDetail', () => {
    service.getDetailAll().subscribe();
    const req = httpMock.expectOne('/api/LoansDetail');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('create issues POST /api/Loans', () => {
    service.create({ bookId: 1, memberId: 2 }).subscribe(id => expect(id).toBe(7));
    const req = httpMock.expectOne('/api/Loans');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ bookId: 1, memberId: 2 });
    req.flush(7);
  });

  it('returnBook issues PUT /api/Loans/:id/return', () => {
    service.returnBook(7).subscribe();
    const req = httpMock.expectOne('/api/Loans/7/return');
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });
});