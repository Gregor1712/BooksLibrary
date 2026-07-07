import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { selectDocumentCollection, selectDocuments } from '../store/documents.selectors';
import { DocumentsActions, DocumentsApiActions } from '../store/documents.actions';
import { GoogleBooksService } from '../documents.service';

@Component({
  selector: 'app-doc',
  templateUrl: './doc.component.html',
  styleUrls: ['./doc.component.scss']
})
export class DocComponent {

  documents$ = this.store.select(selectDocuments);
  documentCollection$ = this.store.select(selectDocumentCollection);

  onAdd(documentId: string) {
    this.store.dispatch(DocumentsActions.addDocument({ documentId }));
  }

  onRemove(documentId: string) {
    this.store.dispatch(DocumentsActions.removeDocument({ documentId }));
  }

  constructor(private documentsService: GoogleBooksService, private store: Store) {}

  ngOnInit() {
    this.documentsService
      .getBooks()
      .subscribe((documents) =>
        this.store.dispatch(DocumentsApiActions.retrievedDocumentList({ documents }))
      );
  }

}
