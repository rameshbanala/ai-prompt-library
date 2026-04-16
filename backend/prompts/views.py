import json
import redis

from django.conf import settings
from django.db.models import F
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Prompt


def get_redis():
    """
    Factory — Redis connection with tight timeouts so it fails fast
    when Redis isn't available (no hanging requests).
    """
    return redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=0,
        decode_responses=True,
        socket_connect_timeout=1,  # give up connecting after 1s
        socket_timeout=1,          # give up on read/write after 1s
    )


def prompt_to_dict(prompt, include_content=False):
    """Serialize a Prompt instance to a dict."""
    data = {
        'id': prompt.id,
        'title': prompt.title,
        'complexity': prompt.complexity,
        'view_count': getattr(prompt, 'view_count', 0),
        'created_at': prompt.created_at.isoformat(),
    }
    if include_content:
        data['content'] = prompt.content
    return data


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def prompt_list(request):
    """
    GET  /prompts/?search=<query>&sort=date|complexity
    POST /prompts/   { title, content, complexity }
    """
    if request.method == 'GET':
        try:
            search = request.GET.get('search', '').strip()
            sort = request.GET.get('sort', 'date')

            # defer('content') skips the large TextField on list — big speed win
            prompts = Prompt.objects.defer('content')

            if search:
                prompts = prompts.filter(title__icontains=search)

            if sort == 'complexity':
                prompts = prompts.order_by('-complexity')
            else:
                prompts = prompts.order_by('-created_at')

            data = [prompt_to_dict(p) for p in prompts]
            return JsonResponse({'success': True, 'data': data}, safe=False)

        except Exception as e:
            return JsonResponse(
                {'success': False, 'error': f'Failed to fetch prompts: {str(e)}'},
                status=500,
            )

    # ----- POST: create -----
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON body.'}, status=400)

    title = body.get('title', '').strip()
    content = body.get('content', '').strip()
    complexity = body.get('complexity')

    errors = {}
    if len(title) < 3:
        errors['title'] = 'Title must be at least 3 characters.'
    if len(content) < 20:
        errors['content'] = 'Content must be at least 20 characters.'
    if complexity is None:
        errors['complexity'] = 'Complexity is required.'
    else:
        try:
            complexity = int(complexity)
            if not (1 <= complexity <= 10):
                errors['complexity'] = 'Complexity must be between 1 and 10.'
        except (ValueError, TypeError):
            errors['complexity'] = 'Complexity must be an integer between 1 and 10.'

    if errors:
        return JsonResponse({'success': False, 'error': errors}, status=400)

    try:
        prompt = Prompt.objects.create(title=title, content=content, complexity=complexity)
        return JsonResponse(
            {'success': True, 'data': prompt_to_dict(prompt, include_content=True)},
            status=201,
        )
    except Exception as e:
        return JsonResponse(
            {'success': False, 'error': f'Failed to create prompt: {str(e)}'},
            status=500,
        )


@csrf_exempt
@require_http_methods(['GET'])
def prompt_detail(request, prompt_id):
    """
    GET /prompts/<id>/

    View count strategy:
    1. Always atomically increment the DB column (persistent, no Redis needed).
    2. Optionally also push to Redis for fast in-memory tracking if Redis is up.
    3. Return the DB count — it's the source of truth.
    """
    try:
        prompt = Prompt.objects.get(id=prompt_id)
    except Prompt.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Prompt not found.'}, status=404)

    # Atomic DB increment via F() — no race conditions, works without Redis
    Prompt.objects.filter(id=prompt_id).update(view_count=F('view_count') + 1)
    prompt.refresh_from_db(fields=['view_count'])
    view_count = prompt.view_count

    # Optional Redis bonus: keep a fast in-memory counter in sync
    # Will fail fast (1s timeout) if Redis isn't running — never blocks the response
    try:
        r = get_redis()
        r.incr(f'prompt:{prompt_id}:views')
    except Exception:
        pass  # Redis down — DB count is the source of truth, no problem

    data = prompt_to_dict(prompt, include_content=True)
    data['view_count'] = view_count

    return JsonResponse({'success': True, 'data': data})
