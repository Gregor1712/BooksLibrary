import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { ConfirmationService } from 'primeng/api';
import { SharedModule } from '../shared/shared.module';
import { LoanDialogComponent } from './loan-dialog/loan-dialog.component';
import { LoansPageComponent } from './loans-page/loans-page.component';
import { LoansEffects } from './store/loans.effects';
import { loansFeatureKey, loansReducer } from './store/loans.reducer';

const routes: Routes = [{ path: '', component: LoansPageComponent }];

@NgModule({
  declarations: [LoansPageComponent, LoanDialogComponent],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    StoreModule.forFeature(loansFeatureKey, loansReducer),
    EffectsModule.forFeature([LoansEffects]),
  ],
  providers: [ConfirmationService],
})
export class LoansModule {}
