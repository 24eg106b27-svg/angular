import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { CSE_YEARS, Semester, Year } from './curriculum';

interface Dept {
  id: string;
  name: string;
  about: string;
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private host = inject(ElementRef);

  // ---------- your data (edit here) ----------
  departments: Dept[] = [
    { id: 'CSE', name: 'Computer Science and Engineering', about: 'Add 2-3 lines about this department here (app.ts).' },
    { id: 'ECE', name: 'Electronics and Communication Engineering', about: 'Add 2-3 lines about this department here (app.ts).' },
    { id: 'EEE', name: 'Electrical and Electronics Engineering', about: 'Add 2-3 lines about this department here (app.ts).' },
    { id: 'MBA', name: 'Master of Business Administration', about: 'Add 2-3 lines about this department here (app.ts).' },
    { id: 'ME', name: 'Mechanical Engineering', about: 'Add 2-3 lines about this department here (app.ts).' },
  ];

  // image file in public/ for each key
  images: Record<string, string> = {
    'campus-hero': 'campus-hero.jpg',
    CSE: 'cse.png',
    ECE: 'ECE.png',
    EEE: 'EEE.png',
    MBA: 'MBA.jpg',
    ME: 'ME.jpg',
  };

  // page colour below the image = dark tint of each image's bottom edge
  colors: Record<string, string> = {
    'campus-hero': '#27282a',
    CSE: '#1f2932',
    ECE: '#22262e',
    EEE: '#33281e',
    MBA: '#1f2e32',
    ME: '#192a38',
  };

  // department id -> syllabus data. Add ECE: ECE_YEARS here when you have that file.
  syllabus: Record<string, Year[] | undefined> = { CSE: CSE_YEARS };

  // ---------- state ----------
  picked = signal<string | null>(null); // what the dropdown shows (image preview)
  chosen = signal<string | null>(null); // confirmed with the "Choose this course" button
  open = signal(false); // dropdown open/closed
  openRow = signal<string | null>(null); // which subject row is expanded

  // ---------- values worked out from the state ----------
  bgKey = computed(() => this.picked() ?? 'campus-hero');
  color = computed(() => this.colors[this.bgKey()]);

  // photo with a dark top shade and a bottom fade into the page colour
  heroBg = computed(
    () =>
      `linear-gradient(to bottom, rgba(0,0,0,.42) 0%, rgba(0,0,0,.3) 50%, ${this.color()} 100%), url(${this.images[this.bgKey()]})`
  );

  pickedDept = computed(() => this.departments.find((d) => d.id === this.picked()));
  chosenDept = computed(() => this.departments.find((d) => d.id === this.chosen()));

  // before choosing: common page shows CSE years. After choosing: that department's years (or undefined = not added yet).
  shown = computed(() => {
    const id = this.chosen();
    return id ? this.syllabus[id] : this.syllabus['CSE'];
  });

  stats = computed(() => {
    const years = this.shown() ?? [];
    let courses = 0;
    let credits = 0;
    let semesters = 0;
    for (const y of years) {
      for (const s of y.semesters) {
        semesters++;
        courses += s.subjects.length;
        credits += this.sum(s, 'credits');
      }
    }
    return { courses, credits, semesters };
  });

  // ---------- actions ----------
  pick(id: string | null) {
    this.picked.set(id);
    this.chosen.set(null);
    this.openRow.set(null);
    this.open.set(false);
  }

  choose() {
    this.chosen.set(this.picked());
    this.openRow.set(null);
  }

  toggleMenu() {
    this.open.update((v) => !v);
  }

  toggleRow(code: string) {
    this.openRow.set(this.openRow() === code ? null : code);
  }

  sum(s: Semester, key: 'l' | 't' | 'p' | 'credits') {
    return s.subjects.reduce((total, b) => total + b[key], 0);
  }

  // click outside the dropdown or press Esc -> close it
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
