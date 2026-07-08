import { Component, inject  } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgForOf } from '@angular/common';
import { increment, decrement, reset } from "./store/test.action";
import { selectTest } from "./store/test.selectors";
import { selectDocumentCollection } from "../documents/store/documents.selectors";

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [AsyncPipe, NgForOf],
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent {

  private store = inject(Store);

  test$ = this.store.select(selectTest);

  // data from Documents
  documentCollection$ = this.store.select(selectDocumentCollection);


  onIncrement() { this.store.dispatch(increment()); }
  onDecrement() { this.store.dispatch(decrement()); }
  onReset()     { this.store.dispatch(reset()); }

}
