import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterOptions {
  language: string;
  sort: string;
  period: string;
}

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.css'
})
export class FilterComponent implements OnInit {
  @Output() filterChange = new EventEmitter<FilterOptions>();

  selectedLanguage = '';
  selectedSort = 'stars';
  selectedPeriod = 'daily';

  languages = [
    'TypeScript',
    'JavaScript',
    'Python',
    'Java',
    'C++',
    'C#',
    'PHP',
    'Ruby',
    'Go',
    'Rust',
    'Swift',
    'Kotlin',
    'Dart',
    'HTML',
    'CSS',
    'Shell',
    'Vue',
    'React'  ];

  ngOnInit() {
    // Emit initial filter state
    this.emitFilterChange();
  }

  onLanguageChange(): void {
    this.emitFilterChange();
  }

  onSortChange(): void {
    this.emitFilterChange();
  }

  onPeriodChange(): void {
    this.emitFilterChange();
  }

  clearFilters(): void {
    this.selectedLanguage = '';
    this.selectedSort = 'stars';
    this.selectedPeriod = 'daily';
    this.emitFilterChange();
  }

  clearLanguage(): void {
    this.selectedLanguage = '';
    this.emitFilterChange();
  }

  clearSort(): void {
    this.selectedSort = 'stars';
    this.emitFilterChange();
  }

  clearPeriod(): void {
    this.selectedPeriod = 'daily';
    this.emitFilterChange();
  }

  hasActiveFilters(): boolean {
    return this.selectedLanguage !== '' || 
           this.selectedSort !== 'stars' || 
           this.selectedPeriod !== 'daily';
  }

  getPeriodLabel(period: string): string {
    const labels: { [key: string]: string } = {
      'daily': 'Today',
      'weekly': 'This Week',
      'monthly': 'This Month',
      'all': 'All Time'
    };
    return labels[period] || period;
  }

  getSortLabel(sort: string): string {
    const labels: { [key: string]: string } = {
      'stars': 'Stars',
      'forks': 'Forks',
      'updated': 'Recently Updated',
      'created': 'Recently Created'
    };
    return labels[sort] || sort;
  }  private emitFilterChange(): void {
    const filters: FilterOptions = {
      language: this.selectedLanguage,
      sort: this.selectedSort,
      period: this.selectedPeriod
    };
    this.filterChange.emit(filters);
  }
}
