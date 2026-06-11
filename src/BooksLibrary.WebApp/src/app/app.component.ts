import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  menuItems: MenuItem[] = [
    { label: 'Books', icon: 'pi pi-book', routerLink: '/books' },
    { label: 'Loans', icon: 'pi pi-sync', routerLink: '/loans' },
  ];
}
