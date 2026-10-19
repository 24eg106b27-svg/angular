import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private host = inject(ElementRef);

  backgrounds: Record<string, string> = {
    CSE: 'cse.png',
    ECE: 'ECE.png',
    EEE: 'EEE.png',
    MBA: 'MBA.jpg',
    ME: 'ME.jpg', // must match the real file name in public/
    'campus-hero': 'campus-hero.jpg',
  };

  departments = ['CSE', 'ECE', 'EEE', 'MBA', 'ME'];

  selected = signal('CSE');
  open = signal(false);

  toggle() {
    this.open.update((v) => !v);
  }

  choose(dept: string) {
    this.selected.set(dept);
    this.open.set(false);
  }

  // click anywhere outside the dropdown -> close
  @HostListener('document:mousedown', ['$event'])
  onDocClick(e: MouseEvent) {
    const dd = (this.host.nativeElement as HTMLElement).querySelector('.dropdown');
    if (dd && !dd.contains(e.target as Node)) this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.open.set(false);
  }
}
