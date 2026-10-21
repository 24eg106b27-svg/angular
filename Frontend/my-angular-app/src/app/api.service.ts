import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// ---------- shapes of the JSON coming from the backend ----------
export interface Subject {
  code: string;
  name: string;
  l: number;
  t: number;
  p: number;
  credits: number;
  syllabus: string;
  textbooks: string;
  referenceBooks: string;
  outcomes: string;
}
export interface Semester {
  semester: number;
  subjects: Subject[];
}
export interface Year {
  year: number;
  note?: string;
  semesters: Semester[];
}
export interface Curriculum {
  department: string;
  regulation: string;
  years: Year[];
}
export interface Dept {
  id: string;
  name: string;
  about: string;
  image: string;
  color: string;
  hasSyllabus: boolean;
}
export interface Home {
  title: string;
  subtitle: string;
  image: string;
  color: string;
}
export interface DeptList {
  home: Home;
  commonSource: string;
  departments: Dept[];
}

// Where the backend runs. Change this when you deploy.
const API = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  departments() {
    return this.http.get<DeptList>(`${API}/departments`);
  }

  curriculum(id: string) {
    return this.http.get<Curriculum>(`${API}/departments/${id}/curriculum`);
  }
}
