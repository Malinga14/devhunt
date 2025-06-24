import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GitHubRepository } from '../../models/repository.model';
import { FavoritesService } from '../../services/favorites.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-repo-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './repo-card.component.html',
  styleUrl: './repo-card.component.css'
})
export class RepoCardComponent implements OnInit, OnDestroy {
  @Input() repository!: GitHubRepository;
  @Output() showDetails = new EventEmitter<GitHubRepository>();
  isFavorite = false;
  private subscription: Subscription = new Subscription();

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.favoritesService.favorites$.subscribe(() => {
        this.isFavorite = this.favoritesService.isFavorite(this.repository.id);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toggleFavorite(): void {
    this.favoritesService.toggleFavorite(this.repository);
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  getLanguageColor(language: string): string {
    const colors: { [key: string]: string } = {
      'TypeScript': 'bg-blue-500',
      'JavaScript': 'bg-yellow-400',
      'Python': 'bg-green-500',
      'Java': 'bg-orange-500',
      'C++': 'bg-pink-500',
      'C#': 'bg-purple-500',
      'PHP': 'bg-indigo-500',
      'Ruby': 'bg-red-500',
      'Go': 'bg-cyan-500',
      'Rust': 'bg-orange-600',
      'Swift': 'bg-orange-400',
      'Kotlin': 'bg-purple-400',
      'Dart': 'bg-blue-400',
      'HTML': 'bg-orange-300',
      'CSS': 'bg-blue-300',
      'Shell': 'bg-gray-500',
      'Vue': 'bg-green-400',
      'React': 'bg-blue-400',
    };
    return colors[language] || 'bg-gray-400';
  }

  onShowDetails(): void {
    this.showDetails.emit(this.repository);
  }

  onCardClick(event: Event): void {
    // Prevent card click when clicking on favorite button or external links
    const target = event.target as HTMLElement;
    if (target.closest('.favorite-btn') || target.closest('.external-link')) {
      return;
    }
    this.onShowDetails();
  }
}
