from django.http import JsonResponse
from firebase_admin import auth

class FirebaseAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Authorization header missing or invalid'}, status=401)

        token = auth_header.split('Bearer ')[1]
        try:
            decoded_token = auth.verify_id_token(token)
            request.firebase_user = decoded_token
        except Exception:
            return JsonResponse({'error': 'Invalid or expired token'}, status=401)

        return self.get_response(request)
