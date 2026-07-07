import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { routerReducer, StoreRouterConnectingModule } from '@ngrx/router-store';

import { provideStore, StoreModule } from '@ngrx/store';

import { documentsReducer } from './documents/store/documents.reducer';
import { collectionReducer } from './documents/store/collection.reducer';

import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { MessageService } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { ToastModule } from 'primeng/toast';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ApiErrorInterceptor } from './core/interceptors/api-error.interceptor';

import {testReducer} from "./test/store/test.reducer";
import { DocumentsComponent } from './documents/documents/documents.component';
import { CollectionComponent } from './documents/collection/collection.component';
import { DocComponent } from './documents/doc/doc.component';

@NgModule({
  declarations: [AppComponent,
    DocumentsComponent,
    CollectionComponent,
    DocComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,

    StoreModule.forRoot({
      router: routerReducer,
      test: testReducer,
      documents: documentsReducer,
      collection: collectionReducer,
    }),
    EffectsModule.forRoot([]),
    StoreRouterConnectingModule.forRoot(),
    StoreDevtoolsModule.instrument({ maxAge: 25 }),

    MenubarModule,
    ToastModule,
  ],
  providers: [
    MessageService,

    //provideStore({ test: testReducer }),

    { provide: HTTP_INTERCEPTORS, useClass: ApiErrorInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
