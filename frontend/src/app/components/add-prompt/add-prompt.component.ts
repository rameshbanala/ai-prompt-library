import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PromptService } from '../../services/prompt.service';

@Component({
  selector: 'app-add-prompt',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-prompt.component.html',
  styleUrl: './add-prompt.component.css',
})
export class AddPromptComponent {
  private readonly fb = inject(FormBuilder);
  private readonly promptService = inject(PromptService);
  private readonly router = inject(Router);

  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    content: ['', [Validators.required, Validators.minLength(20)]],
    complexity: [
      null as number | null,
      [Validators.required, Validators.min(1), Validators.max(10)],
    ],
  });

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const payload = {
      title: this.form.value.title!,
      content: this.form.value.content!,
      complexity: this.form.value.complexity!,
    };

    this.promptService.createPrompt(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/prompts']);
      },
      error: (err) => {
        this.loading = false;
        const body = err.error;
        if (body?.error && typeof body.error === 'object') {
          this.error = Object.values(body.error).join(' ');
        } else if (body?.error) {
          this.error = body.error;
        } else {
          this.error = 'Failed to create prompt. Please try again.';
        }
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/prompts']);
  }
}
