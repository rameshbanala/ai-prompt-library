import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PromptService } from '../../services/prompt.service';
import { Prompt } from '../../models/prompt.model';

@Component({
  selector: 'app-prompt-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prompt-list.component.html',
  styleUrl: './prompt-list.component.css',
})
export class PromptListComponent implements OnInit {
  private readonly promptService = inject(PromptService);
  private readonly router = inject(Router);

  prompts: Prompt[] = [];
  loading = true;
  error: string | null = null;

  searchTerm = '';
  sortBy = 'date';

  ngOnInit(): void {
    this.loadPrompts();
  }

  loadPrompts(): void {
    this.loading = true;
    this.error = null;

    this.promptService.getPrompts(this.searchTerm, this.sortBy).subscribe({
      next: (prompts) => {
        this.prompts = prompts;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load prompts. Please check your connection and try again.';
        this.loading = false;
      },
    });
  }

  onSearchChange(): void {
    this.loadPrompts();
  }

  onSortChange(): void {
    this.loadPrompts();
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/prompts', id]);
  }

  navigateToAdd(): void {
    this.router.navigate(['/add-prompt']);
  }

  getComplexityClass(complexity: number): string {
    if (complexity <= 3) return 'low';
    if (complexity <= 7) return 'medium';
    return 'high';
  }

  getComplexityLabel(complexity: number): string {
    if (complexity <= 3) return 'Low';
    if (complexity <= 7) return 'Medium';
    return 'High';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
