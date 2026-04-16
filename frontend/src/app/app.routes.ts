import { Routes } from '@angular/router';
import { PromptListComponent } from './components/prompt-list/prompt-list.component';
import { PromptDetailComponent } from './components/prompt-detail/prompt-detail.component';
import { AddPromptComponent } from './components/add-prompt/add-prompt.component';

export const routes: Routes = [
  { path: '', redirectTo: 'prompts', pathMatch: 'full' },
  { path: 'prompts', component: PromptListComponent },
  { path: 'prompts/:id', component: PromptDetailComponent },
  { path: 'add-prompt', component: AddPromptComponent },
  { path: '**', redirectTo: 'prompts' },
];
