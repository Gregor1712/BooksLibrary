import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { ConfirmationService } from 'primeng/api';
import { SharedModule } from '../shared/shared.module';
import { BookDialogComponent } from './book-dialog/book-dialog.component';
import { BooksPageComponent } from './books-page/books-page.component';
import { BooksEffects } from './store/books.effects';
import { booksFeatureKey, booksReducer } from './store/books.reducer';

const routes: Routes = [{ path: '', component: BooksPageComponent }];

@NgModule({
  declarations: [BooksPageComponent, BookDialogComponent],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    StoreModule.forFeature(booksFeatureKey, booksReducer),
    EffectsModule.forFeature([BooksEffects]),
  ],
  providers: [ConfirmationService],
})
export class BooksModule {}
