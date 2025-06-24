import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { GitHubRepository } from '../../models/repository.model';
import { GitHubService } from '../../services/github.service';
import { SearchComponent } from '../../components/search/search.component';
import { FilterComponent } from '../../components/filter/filter.component';
import { RepoCardComponent } from '../../components/repo-card/repo-card.component';
import { RepoDetailsComponent } from '../../components/repo-details/repo-details.component';

@Component({
  selector: 'app-explore',
  imports: [CommonModule, FormsModule, SearchComponent, FilterComponent, RepoCardComponent, RepoDetailsComponent],
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.css'
})
export class ExploreComponent implements OnInit, OnDestroy {
  repositories: GitHubRepository[] = [];
  loading = false;
  error = '';
  hasSearched = false;
  currentPage = 1;
  totalPages = 1;
  hasMorePages = false;
  
  // Store current search state
  private currentSearchQuery = '';
  private currentFilters: any = {};
  
  // Details modal state
  selectedRepository: GitHubRepository | null = null;
  showDetailsModal = false;
  
  private destroy$ = new Subject<void>();

  constructor(private githubService: GitHubService) {}
  ngOnInit() {
    // Initialize default filters
    this.currentFilters = {
      language: '',
      sort: 'stars',
      period: 'daily'
    };
    // Load trending repositories by default
    this.loadTrendingRepositories(this.currentFilters);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  onSearch(query: string) {
    this.currentSearchQuery = query;
    if (query.trim()) {
      this.searchRepositories(query);
    } else {
      this.loadTrendingRepositories(this.currentFilters);
    }
  }  onFiltersChange(filters: any) {
    this.currentFilters = filters;
    // Apply filters to current search or trending
    if (this.hasSearched && this.currentSearchQuery.trim()) {
      this.searchRepositories(this.currentSearchQuery);
    } else {
      this.loadTrendingRepositories(filters);
    }
  }
  private searchRepositories(query: string, page: number = 1) {
    this.loading = true;
    this.error = '';
    this.hasSearched = true;
    this.currentPage = page;

    const language = this.currentFilters?.language || '';
    const sort = this.currentFilters?.sort || 'stars';
    const order = 'desc';

    this.githubService.searchRepositories(query, language, sort, order, page)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (page === 1) {
            this.repositories = response.items;
          } else {
            this.repositories = [...this.repositories, ...response.items];
          }
          this.totalPages = Math.ceil(response.total_count / 30);
          this.hasMorePages = this.currentPage < this.totalPages;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to search repositories. Please try again.';
          this.loading = false;
          console.error('Search error:', error);
        }
      });
  }
  loadTrendingRepositories(filters?: any) {
    this.loading = true;
    this.error = '';
    this.hasSearched = false;

    const language = filters?.language || '';
    const period = filters?.period || 'daily';
    const sort = filters?.sort || 'stars';

    // For trending repositories, we'll use the search API with appropriate filters
    const today = new Date();
    const pastDate = new Date();
    
    switch (period) {
      case 'weekly':
        pastDate.setDate(today.getDate() - 7);
        break;
      case 'monthly':
        pastDate.setDate(today.getDate() - 30);
        break;
      case 'all':
        pastDate.setFullYear(2008); // GitHub founding year
        break;
      default: // daily
        pastDate.setDate(today.getDate() - 1);
    }

    const dateString = pastDate.toISOString().split('T')[0];
    let query = period === 'all' ? 'stars:>1' : `created:>${dateString}`;
    
    if (language) {
      query += ` language:${language}`;
    }

    // Use searchRepositories to get proper sorting
    this.githubService.searchRepositories(query, '', sort, 'desc', 1, 30)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.repositories = response.items;
          this.loading = false;
          this.hasMorePages = false;
        },
        error: (error) => {
          this.error = 'Failed to load repositories. Please try again.';
          this.loading = false;
          console.error('Trending error:', error);
        }
      });
  }
  loadMore() {
    if (this.hasMorePages && !this.loading && this.hasSearched) {
      const nextPage = this.currentPage + 1;
      if (this.currentSearchQuery.trim()) {
        this.searchRepositories(this.currentSearchQuery, nextPage);
      }
    }
  }
  // Methods for handling repository details
  onShowRepositoryDetails(repository: GitHubRepository) {
    this.selectedRepository = repository;
    this.showDetailsModal = true;
  }

  onCloseDetails() {
    this.showDetailsModal = false;
    this.selectedRepository = null;
  }

  trackByRepo(index: number, repo: GitHubRepository): number {
    return repo.id;
  }
}
