import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { ApiErrorInterceptor } from './api-error.interceptor';

describe('ApiErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    messageService = jasmine.createSpyObj('MessageService', ['add']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: MessageService, useValue: messageService },
        { provide: HTTP_INTERCEPTORS, useClass: ApiErrorInterceptor, multi: true },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('shows the backend detail for 409 responses', () => {
    http.get('/api/Loans').subscribe({ error: () => {} });
    httpMock.expectOne('/api/Loans').flush(
      { status: 409, title: 'Business rule violation', detail: 'Member has reached the maximum of 5 active loans.' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'error',
      detail: 'Member has reached the maximum of 5 active loans.',
    }));
  });

  it('shows the backend detail for 400 responses', () => {
    http.post('/api/Books', {}).subscribe({ error: () => {} });
    httpMock.expectOne('/api/Books').flush(
      { status: 400, title: 'Validation failed', detail: 'Title must not be empty.' },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'error',
      detail: 'Title must not be empty.',
    }));
  });

  it('shows a generic message for 500 responses', () => {
    http.get('/api/Books').subscribe({ error: () => {} });
    httpMock.expectOne('/api/Books').flush('boom', { status: 500, statusText: 'Server Error' });

    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'error',
      detail: 'Something went wrong',
    }));
  });

  it('re-throws the error so effects still see the failure', () => {
    let caught = false;
    http.get('/api/Books').subscribe({ error: () => (caught = true) });
    httpMock.expectOne('/api/Books').flush('boom', { status: 500, statusText: 'Server Error' });
    expect(caught).toBeTrue();
  });
});
