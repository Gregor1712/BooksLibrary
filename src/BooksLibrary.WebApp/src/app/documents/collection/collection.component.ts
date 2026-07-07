import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Document } from '../document.model';

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss']
})
export class CollectionComponent {
  @Input() books: ReadonlyArray<Document> = [];
  @Output() remove = new EventEmitter<string>();
}
