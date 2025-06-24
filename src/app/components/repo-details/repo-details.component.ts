import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { GitHubRepository, GitHubContributor } from '../../models/repository.model';
import { GitHubService } from '../../services/github.service';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-repo-details',
  imports: [CommonModule],
  templateUrl: './repo-details.component.html',
  styleUrl: './repo-details.component.css'
})
export class RepoDetailsComponent implements OnInit, OnDestroy {
  @Input() repository!: GitHubRepository;
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  contributors: GitHubContributor[] = [];
  readme = '';
  loading = false;
  error = '';
  isFavorite = false;
  isCloning = false;
  cloneMessage = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private githubService: GitHubService,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit() {
    if (this.repository) {
      this.loadDetails();
      this.checkFavoriteStatus();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDetails() {
    if (!this.repository) return;

    this.loading = true;
    this.error = '';

    // Load both contributors and README in parallel
    forkJoin({
      contributors: this.githubService.getRepositoryContributors(this.repository.owner.login, this.repository.name),
      readme: this.githubService.getRepositoryReadme(this.repository.owner.login, this.repository.name)
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (results) => {
        this.contributors = results.contributors.slice(0, 6); // Show top 6 contributors
        this.readme = results.readme;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load repository details';
        this.loading = false;
        console.error('Details error:', error);
      }
    });
  }

  checkFavoriteStatus() {
    this.favoritesService.getFavorites()
      .pipe(takeUntil(this.destroy$))
      .subscribe(favorites => {
        this.isFavorite = favorites.some(fav => fav.id === this.repository.id);
      });
  }
  toggleFavorite() {
    if (this.isFavorite) {
      this.favoritesService.removeFromFavorites(this.repository.id);
    } else {
      this.favoritesService.addToFavorites(this.repository);
    }
  }

  onClose() {
    this.close.emit();
  }
  openRepository() {
    window.open(this.repository.html_url, '_blank');
  }
  async cloneRepository() {
    if (!this.repository?.clone_url) {
      console.error('No clone URL available');
      this.showCloneMessage('Clone URL not available', 'error');
      return;
    }

    this.isCloning = true;
    this.cloneMessage = '';

    try {
      // Use clone_url from the repository
      const cloneUrl = this.repository.clone_url;
      
      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(cloneUrl);
        this.showCloneMessage('Clone URL copied to clipboard!', 'success');
        console.log('Clone URL copied to clipboard:', cloneUrl);
      } else {
        // Fallback for older browsers
        this.fallbackCopyToClipboard(cloneUrl);
        this.showCloneMessage('Clone URL copied to clipboard!', 'success');
      }
    } catch (error) {
      console.error('Failed to copy clone URL:', error);
      
      // Try fallback method
      try {
        this.fallbackCopyToClipboard(this.repository.clone_url);
        this.showCloneMessage('Clone URL copied to clipboard!', 'success');
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError);
        this.showCloneMessage('Failed to copy clone URL. Please copy manually from GitHub.', 'error');
      }
    } finally {
      this.isCloning = false;
    }
  }

  private showCloneMessage(message: string, type: 'success' | 'error') {
    this.cloneMessage = message;
    
    // Clear message after 3 seconds
    setTimeout(() => {
      this.cloneMessage = '';
    }, 3000);
  }

  private fallbackCopyToClipboard(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (!successful) {
      throw new Error('Fallback copy method failed');
    }
    
    console.log('Clone URL copied using fallback method');
  }

  getLanguageColor(language: string): string {
    const colors: { [key: string]: string } = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#2b7489',
      'Python': '#3572A5',
      'Java': '#b07219',
      'C++': '#f34b7d',
      'C#': '#239120',
      'PHP': '#4F5D95',
      'Ruby': '#701516',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'Swift': '#ffac45',
      'Kotlin': '#F18E33',
      'Dart': '#00B4AB',
      'HTML': '#e34c26',
      'CSS': '#1572B6',
      'Vue': '#4FC08D',
      'React': '#61DAFB',
      'Angular': '#DD0031'
    };
    return colors[language] || '#6B7280';
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Simple markdown to HTML converter for README
  convertMarkdownToHtml(markdown: string): string {
    if (!markdown) return '';
    
    // This is a very basic markdown converter
    // In a real app, you'd use a proper markdown library like marked.js
    return markdown
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mb-2 text-white">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mb-3 text-white">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 text-white">$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/gim, '<code class="bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/\n/gim, '<br>');
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
