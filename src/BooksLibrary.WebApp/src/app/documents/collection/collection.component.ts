import { Component, EventEmitter, Input, Output } from '@angular/core';
import {Book} from "../../core/models/book";
//import { Document } from '../document.model';

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss']
})
export class CollectionComponent {
  @Input() books: ReadonlyArray<Book> = [];
  @Output() remove = new EventEmitter<number>();
}
