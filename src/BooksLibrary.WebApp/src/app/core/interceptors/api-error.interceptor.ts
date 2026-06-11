import {
  HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable()
export class ApiErrorInterceptor implements HttpInterceptor {
  constructor(private messageService: MessageService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.toMessage(error),
        });
        return throwError(() => error);
      }),
    );
  }

  private toMessage(error: HttpErrorResponse): string {
    if ([400, 404, 409].includes(error.status)) {
      return error.error?.detail ?? error.error?.title ?? 'Request failed';
    }
    return 'Something went wrong';
  }
}
