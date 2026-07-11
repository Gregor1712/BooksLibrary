import { Component, EventEmitter, Input, Output } from '@angular/core';
import {Book} from "../../core/models/book";
//import { Document } from '../document.model';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss']
})
export class DocumentsComponent {
  @Input() books: ReadonlyArray<Book> = [];
  @Output() add = new EventEmitter<number>();
}




