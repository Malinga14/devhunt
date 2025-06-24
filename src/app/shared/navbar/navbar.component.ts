import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMobileMenuOpen = false;
  favoriteCount = 0;
  isNavbarVisible = true;
  private lastScrollTop = 0;
  private scrollTimeout: any;
  private subscription: Subscription = new Subscription();

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.favoritesService.favorites$.subscribe(favorites => {
        this.favoriteCount = favorites.length;
      })
    );
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    // Clean up body styles on component destroy
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    
    // Toggle body scroll lock
    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    
    // Restore body scroll
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Clear previous timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    // If at the very top of the page, always show navbar
    if (scrollTop <= 10) {
      this.isNavbarVisible = true;
      this.lastScrollTop = scrollTop;
      return;
    }
    
    // Hide navbar during any scrolling (up or down)
    this.isNavbarVisible = false;
    this.closeMobileMenu();
    
    // Show navbar when scrolling stops (after 200ms of no scroll)
    this.scrollTimeout = setTimeout(() => {
      this.isNavbarVisible = true;
    }, 200);
    
    this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(): void {
    // Close mobile menu when resizing to desktop
    if (window.innerWidth >= 768 && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }
}

