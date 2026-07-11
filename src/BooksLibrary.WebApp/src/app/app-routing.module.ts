import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DocComponent } from './documents/doc/doc.component';

const routes: Routes = [
  { path: 'books', loadChildren: () => import('./books/books.module').then(m => m.BooksModule) },
  { path: 'loans', loadChildren: () => import('./loans/loans.module').then(m => m.LoansModule) },
  { path: 'test', loadComponent: () => import('./test/test.component').then(m => m.TestComponent) },

  { path: 'documents/doc', component: DocComponent },

  { path: '', pathMatch: 'full', redirectTo: 'test' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
