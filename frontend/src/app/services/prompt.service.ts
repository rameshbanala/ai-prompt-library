import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Prompt, ApiResponse } from '../models/prompt.model';

@Injectable({
  providedIn: 'root',
})
export class PromptService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/prompts/';

  getPrompts(search = '', sort = 'date'): Observable<Prompt[]> {
    let params = new HttpParams().set('sort', sort);
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http
      .get<ApiResponse<Prompt[]>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  getPrompt(id: number): Observable<Prompt> {
    return this.http
      .get<ApiResponse<Prompt>>(`${this.baseUrl}${id}/`)
      .pipe(map((res) => res.data));
  }

  createPrompt(data: Partial<Prompt>): Observable<Prompt> {
    return this.http
      .post<ApiResponse<Prompt>>(this.baseUrl, data)
      .pipe(map((res) => res.data));
  }
}
