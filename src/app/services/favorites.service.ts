import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FavoriteRepository, GitHubRepository } from '../models/repository.model';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly storageKey = 'devhunt-favorites';
  private favoritesSubject = new BehaviorSubject<FavoriteRepository[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();

  constructor() {
    this.loadFavorites();
  }

  private loadFavorites(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const favorites = JSON.parse(stored);
        this.favoritesSubject.next(favorites);
      }
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error);
    }
  }

  private saveFavorites(favorites: FavoriteRepository[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(favorites));
      this.favoritesSubject.next(favorites);
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error);
    }
  }

  addToFavorites(repository: GitHubRepository): void {
    const currentFavorites = this.favoritesSubject.value;
    
    if (!this.isFavorite(repository.id)) {
      const favorite: FavoriteRepository = {
        id: repository.id,
        name: repository.name,
        full_name: repository.full_name,
        description: repository.description,
        html_url: repository.html_url,
        stargazers_count: repository.stargazers_count,
        forks_count: repository.forks_count,
        language: repository.language,
        owner: {
          login: repository.owner.login,
          avatar_url: repository.owner.avatar_url
        },
        saved_at: new Date().toISOString()
      };

      const updatedFavorites = [favorite, ...currentFavorites];
      this.saveFavorites(updatedFavorites);
    }
  }

  removeFromFavorites(repositoryId: number): void {
    const currentFavorites = this.favoritesSubject.value;
    const updatedFavorites = currentFavorites.filter(fav => fav.id !== repositoryId);
    this.saveFavorites(updatedFavorites);
  }

  isFavorite(repositoryId: number): boolean {
    const currentFavorites = this.favoritesSubject.value;
    return currentFavorites.some(fav => fav.id === repositoryId);
  }

  toggleFavorite(repository: GitHubRepository): void {
    if (this.isFavorite(repository.id)) {
      this.removeFromFavorites(repository.id);
    } else {
      this.addToFavorites(repository);
    }
  }

  getFavorites(): Observable<FavoriteRepository[]> {
    return this.favorites$;
  }

  getFavoriteCount(): number {
    return this.favoritesSubject.value.length;
  }

  clearAllFavorites(): void {
    this.saveFavorites([]);
  }
}
