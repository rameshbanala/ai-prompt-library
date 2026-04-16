import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PromptService } from '../../services/prompt.service';
import { Prompt } from '../../models/prompt.model';

@Component({
  selector: 'app-prompt-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prompt-detail.component.html',
  styleUrl: './prompt-detail.component.css',
})
export class PromptDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly promptService = inject(PromptService);

  prompt: Prompt | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id)) {
      this.error = 'Invalid prompt ID.';
      this.loading = false;
      return;
    }
    this.loadPrompt(id);
  }

  loadPrompt(id: number): void {
    this.loading = true;
    this.error = null;

    this.promptService.getPrompt(id).subscribe({
      next: (prompt) => {
        this.prompt = prompt;
        this.loading = false;
      },
      error: (err) => {
        if (err.status === 404) {
          this.error = 'Prompt not found. It may have been deleted.';
        } else {
          this.error = 'Failed to load prompt. Please try again.';
        }
        this.loading = false;
      },
    });
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  goBack(): void {
    this.router.navigate(['/prompts']);
  }
}
