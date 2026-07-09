import {Actions, createEffect, ofType} from "@ngrx/effects";
import {GoogleBooksService} from "../documents.service";
import { of } from 'rxjs';
import { map, exhaustMap, catchError } from 'rxjs/operators';
import {Injectable} from "@angular/core";

@Injectable()
export class DocumentsEffects {

  loadDocuments$ = createEffect(() => this.actions$.pipe(
    ofType('[Movies Page] Load Movies'),
    exhaustMap(() => this.moviesService.getBooks()
      .pipe(
        map(docs => ({ type: '[Movies API] Movies Loaded Success', payload: docs })),
        catchError(() => of({ type: '[Movies API] Movies Loaded Error' }))
      ))
  ));

  constructor(
    private actions$: Actions,
    private moviesService: GoogleBooksService
  ) {}

}
