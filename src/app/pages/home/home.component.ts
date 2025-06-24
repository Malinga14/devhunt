import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GitHubService } from '../../services/github.service';
import { FavoritesService } from '../../services/favorites.service';
import { GitHubRepository } from '../../models/repository.model';
import { SearchComponent } from '../../components/search/search.component';
import { RepoCardComponent } from '../../components/repo-card/repo-card.component';
import { RepoDetailsComponent } from '../../components/repo-details/repo-details.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SearchComponent, RepoCardComponent, RepoDetailsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  trendingRepos: GitHubRepository[] = [];
  loading = false;
  favoriteCount = 0;
  searchCount = 0;
  
  // Details modal state
  selectedRepository: GitHubRepository | null = null;
  showDetailsModal = false;

  popularLanguages = [
    { name: 'TypeScript', color: 'bg-blue-500' },
    { name: 'JavaScript', color: 'bg-yellow-400' },
    { name: 'Python', color: 'bg-green-500' },
    { name: 'Java', color: 'bg-orange-500' },
    { name: 'Go', color: 'bg-cyan-500' },
    { name: 'Rust', color: 'bg-orange-600' }
  ];

  private subscription: Subscription = new Subscription();

  constructor(
    private githubService: GitHubService,
    private favoritesService: FavoritesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTrendingRepos();
    this.loadSearchCount();
    
    this.subscription.add(
      this.favoritesService.favorites$.subscribe(favorites => {
        this.favoriteCount = favorites.length;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadTrendingRepos(): void {
    this.loading = true;
    this.subscription.add(
      this.githubService.getTrendingRepositories().subscribe({
        next: (repos) => {
          this.trendingRepos = repos;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading trending repositories:', error);
          this.loading = false;
        }
      })
    );
  }

  onSearch(query: string): void {
    if (query.trim()) {
      this.incrementSearchCount();
      this.router.navigate(['/explore'], { queryParams: { q: query } });
    }
  }

  exploreAll(): void {
    this.router.navigate(['/explore']);
  }

  viewFavorites(): void {
    this.router.navigate(['/favorites']);
  }

  refreshTrending(): void {
    this.loadTrendingRepos();
  }

  searchByLanguage(language: string): void {
    this.incrementSearchCount();
    this.router.navigate(['/explore'], { queryParams: { language: language.toLowerCase() } });
  }

  private loadSearchCount(): void {
    const stored = localStorage.getItem('devhunt-search-count');
    this.searchCount = stored ? parseInt(stored, 10) : 0;
  }

  private incrementSearchCount(): void {
    this.searchCount++;
    localStorage.setItem('devhunt-search-count', this.searchCount.toString());
  }

  // New methods for repository details
  onShowRepositoryDetails(repository: GitHubRepository) {
    this.selectedRepository = repository;
    this.showDetailsModal = true;
  }

  onCloseDetails() {
    this.showDetailsModal = false;
    this.selectedRepository = null;
  }
}
