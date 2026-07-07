import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Document } from '../document.model';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss']
})
export class DocumentsComponent {
  @Input() books: ReadonlyArray<Document> = [];
  @Output() add = new EventEmitter<string>();
}




