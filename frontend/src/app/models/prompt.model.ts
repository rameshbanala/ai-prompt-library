export interface Prompt {
  id: number;
  title: string;
  content: string;
  complexity: number;
  created_at: string;
  view_count?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string | Record<string, string>;
}
