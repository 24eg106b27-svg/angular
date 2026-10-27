import { Component, ElementRef, HostListener, afterNextRender, computed, inject, signal } from '@angular/core';
import { ApiService, Curriculum, Dept, Home, Semester } from './api.service';

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

  home = signal<Home>(FALLBACK_HOME);
  departments = signal<Dept[]>([]);
  commonSource = signal('CSE');
  curricula = signal<Record<string, Curriculum | null>>({});
  error = signal(false);

  picked = signal<string | null>(null);
  chosen = signal<string | null>(null);
  open = signal(false);
  openRow = signal<string | null>(null);

  pickedDept = computed(() => this.departments().find((d) => d.id === this.picked()));
  chosenDept = computed(() => this.departments().find((d) => d.id === this.chosen()));

  bg = computed(() => this.pickedDept() ?? this.home());
  color = computed(() => this.bg().color);

  heroBg = computed(
    () =>
      `linear-gradient(to bottom, rgba(0,0,0,.42) 0%, rgba(0,0,0,.3) 50%, ${this.color()} 100%), url(${this.bg().image})`
  );

  // Show syllabus ONLY after a department is chosen
  shownYears = computed(() => {
    const chosen = this.chosen();
    if (!chosen) return undefined; // nothing chosen: hide syllabus on home page
    const c = this.curricula()[chosen];
    if (!c) return c;
    return c.years;
  });

  stats = computed(() => {
    const years = this.shownYears() ?? [];
    let courses = 0, credits = 0, semesters = 0;
    for (const y of years) {
      for (const s of y.semesters) {
        semesters++;
        courses += s.subjects.length;
        credits += this.sum(s, 'credits');
      }
    }
    return { courses, credits, semesters };
  });

  // list of year numbers for the navbar
  yearList = computed(() => (this.shownYears() ?? []).map((y) => y.year));

  constructor() {
    afterNextRender(() => this.loadAll());
  }

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
    if (id in this.curricula()) return;
    const dept = this.departments().find((d) => d.id === id);
    if (dept && !dept.hasSyllabus) {
      this.curricula.update((m) => ({ ...m, [id]: null }));
      return;
    }
    this.api.curriculum(id).subscribe({
      next: (c) => this.curricula.update((m) => ({ ...m, [id]: c })),
      error: () => this.curricula.update((m) => ({ ...m, [id]: null })),
    });
  }

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

  scrollToYear(year: number) {
    const el = document.getElementById('year-' + year);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  toggleMenu() {
    if (this.error()) this.loadAll();
    this.open.update((v) => !v);
  }

  toggleRow(key: string) {
    this.openRow.set(this.openRow() === key ? null : key);
  }

  sum(s: Semester, key: 'l' | 't' | 'p' | 'credits') {
    return s.subjects.reduce((total, b) => total + b[key], 0);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocClick(e: MouseEvent) {
    const dd = (this.host.nativeElement as HTMLElement).querySelector('.dropdown');
    if (dd && !dd.contains(e.target as Node)) this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEsc() { this.open.set(false); }
}
