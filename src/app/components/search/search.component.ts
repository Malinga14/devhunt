import { Component, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements OnDestroy {
  @Output() search = new EventEmitter<string>();
  
  searchQuery = '';
  isSearching = false;
  showSuggestions = false;
  suggestions = [
    'javascript framework',
    'react components',
    'vue.js',
    'angular material',
    'nodejs api',
    'python machine learning',
    'typescript utilities',
    'css frameworks',
    'web components',
    'mobile development'
  ];

  private searchSubject = new Subject<string>();

  constructor() {
    // Debounce search input
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      if (query.trim()) {
        this.performSearch(query);
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  onSearchInput(): void {
    if (this.searchQuery.length === 0) {
      this.showSuggestions = false;
      this.search.emit('');
      return;
    }

    if (this.searchQuery.length >= 2) {
      this.showSuggestions = true;
      this.searchSubject.next(this.searchQuery);
    } else {
      this.showSuggestions = false;
    }
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.showSuggestions = false;
      this.performSearch(this.searchQuery);
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.showSuggestions = false;
    this.search.emit('');
  }

  selectSuggestion(suggestion: string): void {
    this.searchQuery = suggestion;
    this.showSuggestions = false;
    this.performSearch(suggestion);
  }

  private performSearch(query: string): void {
    this.isSearching = true;
    this.search.emit(query);
    
    // Hide loading after a short delay (the parent component will handle the actual search)
    setTimeout(() => {
      this.isSearching = false;
    }, 500);
  }
}
