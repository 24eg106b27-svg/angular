import { Component, ElementRef, HostListener, afterNextRender, computed, inject, signal } from '@angular/core';
import { ApiService, Curriculum, Dept, Home, Semester } from './api.service';

// shown until the backend answers (and the first paint of the page)
const FALLBACK_HOME: Home = {
  title: 'Anurag University',
  subtitle: 'Pick a department to see its syllabus.',
  image: 'campus-hero.jpg',
  color: '#27282a',
};

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private host = inject(ElementRef);
  private api = inject(ApiService);

  // ---------- data from the backend ----------
  home = signal<Home>(FALLBACK_HOME);
  departments = signal<Dept[]>([]);
  commonSource = signal('CSE'); // department whose Year 1-2 show on the campus page
  // syllabus cache: id -> data. undefined = still loading, null = no file for it
  curricula = signal<Record<string, Curriculum | null>>({});
  error = signal(false); // true when the backend cannot be reached

  // ---------- state ----------
  picked = signal<string | null>(null); // what the dropdown shows (image preview)
  chosen = signal<string | null>(null); // confirmed with the "Choose this course" button
  open = signal(false); // dropdown open/closed
  openRow = signal<string | null>(null); // which subject row is expanded

  // ---------- values worked out from the state ----------
  pickedDept = computed(() => this.departments().find((d) => d.id === this.picked()));
  chosenDept = computed(() => this.departments().find((d) => d.id === this.chosen()));

  // image + colour: the picked department, else the campus home settings
  bg = computed(() => this.pickedDept() ?? this.home());
  color = computed(() => this.bg().color);

  // photo with a dark top shade and a bottom fade into the page colour
  heroBg = computed(
    () =>
      `linear-gradient(to bottom, rgba(0,0,0,.42) 0%, rgba(0,0,0,.3) 50%, ${this.color()} 100%), url(${this.bg().image})`
  );

  // years to show below the hero:
  //   nothing chosen -> Year 1-2 of the commonSource department
  //   chosen         -> all years of that department
  // undefined = loading, null = syllabus file not added yet
  shownYears = computed(() => {
    const chosen = this.chosen();
    const c = this.curricula()[chosen ?? this.commonSource()];
    if (!c) return c;
    return c.years;
  });

  stats = computed(() => {
    const years = this.shownYears() ?? [];
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

  constructor() {
    // runs in the browser only (the server-side render has no backend to talk to)
    afterNextRender(() => this.loadAll());
  }

  // ---------- talking to the backend ----------
  loadAll() {
    this.api.departments().subscribe({
      next: (r) => {
        this.error.set(false);
        this.home.set(r.home);
        this.departments.set(r.departments);
        this.commonSource.set(r.commonSource);
        this.loadCurriculum(r.commonSource);
      },
      error: () => this.error.set(true),
    });
  }

  loadCurriculum(id: string) {
    if (id in this.curricula()) return; // already loaded (or known missing)
    const dept = this.departments().find((d) => d.id === id);
    if (dept && !dept.hasSyllabus) {
      this.curricula.update((m) => ({ ...m, [id]: null })); // backend says: no file for this one
      return;
    }
    this.api.curriculum(id).subscribe({
      next: (c) => this.curricula.update((m) => ({ ...m, [id]: c })),
      error: () => this.curricula.update((m) => ({ ...m, [id]: null })),
    });
  }

  // ---------- actions ----------
  pick(id: string | null) {
    this.picked.set(id);
    this.chosen.set(null);
    this.openRow.set(null);
    this.open.set(false);
    if (id) this.loadCurriculum(id);
  }

  choose() {
    const id = this.picked();
    this.chosen.set(id);
    this.openRow.set(null);
    if (id) this.loadCurriculum(id);
  }

  toggleMenu() {
    if (this.error()) this.loadAll(); // backend was down: try again when the menu is opened
    this.open.update((v) => !v);
  }

  toggleRow(key: string) {
    this.openRow.set(this.openRow() === key ? null : key);
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
