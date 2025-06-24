import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { GitHubRepository, GitHubSearchResponse, GitHubContributor } from '../models/repository.model';

@Injectable({
  providedIn: 'root'
})
export class GitHubService {
  private readonly baseUrl = 'https://api.github.com';
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}
  searchRepositories(
    query: string = '',
    language: string = '',
    sort: string = 'stars',
    order: string = 'desc',
    page: number = 1,
    perPage: number = 30
  ): Observable<GitHubSearchResponse> {
    this.loadingSubject.next(true);
    
    let searchQuery = query || 'stars:>1000';
    if (language) {
      searchQuery += ` language:${language}`;
    }

    // Map sort values to GitHub API sort values
    let githubSort = sort;
    switch (sort) {
      case 'forks':
        githubSort = 'forks';
        break;
      case 'updated':
        githubSort = 'updated';
        break;
      case 'created':
        githubSort = 'created';
        break;
      default:
        githubSort = 'stars';
    }

    const params = new HttpParams()
      .set('q', searchQuery)
      .set('sort', githubSort)
      .set('order', order)
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<GitHubSearchResponse>(`${this.baseUrl}/search/repositories`, { params })
      .pipe(
        map(response => {
          this.loadingSubject.next(false);
          return response;
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          console.error('Error searching repositories:', error);
          return of({ total_count: 0, incomplete_results: false, items: [] });
        })
      );
  }
  getTrendingRepositories(
    language: string = '',
    since: string = 'daily'
  ): Observable<GitHubRepository[]> {
    this.loadingSubject.next(true);
    
    const today = new Date();
    const pastDate = new Date();
    
    switch (since) {
      case 'weekly':
        pastDate.setDate(today.getDate() - 7);
        break;
      case 'monthly':
        pastDate.setDate(today.getDate() - 30);
        break;
      case 'all':
        // For all time, use a very old date
        pastDate.setFullYear(2008); // GitHub was founded in 2008
        break;
      default: // daily
        pastDate.setDate(today.getDate() - 1);
    }

    const dateString = pastDate.toISOString().split('T')[0];
    let query = since === 'all' ? 'stars:>1' : `created:>${dateString}`;
    
    if (language) {
      query += ` language:${language}`;
    }

    const params = new HttpParams()
      .set('q', query)
      .set('sort', 'stars')
      .set('order', 'desc')
      .set('per_page', '30');

    return this.http.get<GitHubSearchResponse>(`${this.baseUrl}/search/repositories`, { params })
      .pipe(
        map(response => {
          this.loadingSubject.next(false);
          return response.items;
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          console.error('Error fetching trending repositories:', error);
          return of([]);
        })
      );
  }

  getRepository(owner: string, repo: string): Observable<GitHubRepository | null> {
    this.loadingSubject.next(true);
    
    return this.http.get<GitHubRepository>(`${this.baseUrl}/repos/${owner}/${repo}`)
      .pipe(
        map(response => {
          this.loadingSubject.next(false);
          return response;
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          console.error('Error fetching repository:', error);
          return of(null);
        })
      );
  }

  getRepositoryContributors(owner: string, repo: string): Observable<GitHubContributor[]> {
    return this.http.get<GitHubContributor[]>(`${this.baseUrl}/repos/${owner}/${repo}/contributors`)
      .pipe(
        map(contributors => contributors.slice(0, 10)), // Top 10 contributors
        catchError(error => {
          console.error('Error fetching contributors:', error);
          return of([]);
        })
      );
  }

  getRepositoryReadme(owner: string, repo: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/repos/${owner}/${repo}/readme`, {
      headers: { 'Accept': 'application/vnd.github.v3.raw' },
      responseType: 'text'
    }).pipe(
      catchError(error => {
        console.error('Error fetching README:', error);
        return of('README not available');
      })
    );
  }
}
