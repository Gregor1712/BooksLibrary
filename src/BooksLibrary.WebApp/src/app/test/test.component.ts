import { Component, inject  } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { increment, decrement, reset } from "./store/test.action";
import { selectTest } from "./store/test.selectors";

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent {

  private store = inject(Store);

  test$ = this.store.select(selectTest);

  onIncrement() { this.store.dispatch(increment()); }
  onDecrement() { this.store.dispatch(decrement()); }
  onReset()     { this.store.dispatch(reset()); }

}
