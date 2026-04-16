from django.db import models


class Prompt(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    complexity = models.IntegerField()
    view_count = models.IntegerField(default=0)  # DB-backed persistent counter
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),   # fast default sort
            models.Index(fields=['-complexity']),    # fast complexity sort
            models.Index(fields=['title']),          # fast title search
        ]

    def __str__(self):
        return self.title
