import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { FavoriteRepository, GitHubRepository } from '../../models/repository.model';
import { FavoritesService } from '../../services/favorites.service';
import { RepoCardComponent } from '../../components/repo-card/repo-card.component';
import { RepoDetailsComponent } from '../../components/repo-details/repo-details.component';

@Component({
  selector: 'app-favorites',
  imports: [CommonModule, RepoCardComponent, RepoDetailsComponent],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css'
})
export class FavoritesComponent implements OnInit, OnDestroy {
  favorites: FavoriteRepository[] = [];
  filteredFavorites: FavoriteRepository[] = [];
  searchQuery = '';
  sortBy: 'name' | 'stars' | 'date' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Details modal state
  selectedRepository: GitHubRepository | null = null;
  showDetailsModal = false;

  private destroy$ = new Subject<void>();

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit() {
    this.loadFavorites();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFavorites() {
    this.favoritesService.getFavorites()
      .pipe(takeUntil(this.destroy$))
      .subscribe(favorites => {
        this.favorites = favorites;
        this.applyFiltersAndSort();
      });
  }

  onSearch(event: any) {
    this.searchQuery = event.target.value.toLowerCase();
    this.applyFiltersAndSort();
  }

  onSortChange(sortBy: 'name' | 'stars' | 'date') {
    if (this.sortBy === sortBy) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'desc';
    }
    this.applyFiltersAndSort();
  }

  private applyFiltersAndSort() {
    let filtered = this.favorites;

    // Apply search filter
    if (this.searchQuery) {
      filtered = filtered.filter(repo => 
        repo.name.toLowerCase().includes(this.searchQuery) ||
        repo.description?.toLowerCase().includes(this.searchQuery) ||
        repo.owner.login.toLowerCase().includes(this.searchQuery) ||
        repo.language?.toLowerCase().includes(this.searchQuery)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (this.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'stars':
          aValue = a.stargazers_count;
          bValue = b.stargazers_count;
          break;
        case 'date':
          aValue = new Date(a.saved_at).getTime();
          bValue = new Date(b.saved_at).getTime();
          break;
      }

      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.filteredFavorites = filtered;
  }

  clearAllFavorites() {
    if (confirm('Are you sure you want to remove all favorites? This action cannot be undone.')) {
      this.favoritesService.clearAllFavorites();
    }
  }

  exportFavorites() {
    const data = JSON.stringify(this.favorites, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'devhunt-favorites.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Convert FavoriteRepository to GitHubRepository for RepoCardComponent
  convertToGitHubRepo(favorite: FavoriteRepository): any {
    return {
      id: favorite.id,
      name: favorite.name,
      full_name: favorite.full_name,
      description: favorite.description,
      html_url: favorite.html_url,
      stargazers_count: favorite.stargazers_count,
      forks_count: favorite.forks_count,
      language: favorite.language,
      owner: favorite.owner,
      topics: [], // Not stored in favorites
      created_at: '',
      updated_at: '',
      pushed_at: '',
      clone_url: '',
      default_branch: 'main',
      open_issues_count: 0,
      watchers_count: favorite.stargazers_count,
      size: 0,
      archived: false,
      disabled: false,
      private: false
    };
  }

  onShowRepositoryDetails(repository: GitHubRepository) {
    this.selectedRepository = repository;
    this.showDetailsModal = true;
  }

  onCloseDetails() {
    this.showDetailsModal = false;
    this.selectedRepository = null;
  }

  trackByFavorite(index: number, favorite: FavoriteRepository): number {
    return favorite.id;
  }
}
