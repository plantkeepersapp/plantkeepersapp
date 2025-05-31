from django.http import JsonResponse
from firebase_admin import auth
import re

class FirebaseAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        # Only exact or specific paths are allowed without auth
        self.exempt_paths = [
            '/',  # Exactly root path
            '/api/',  # API root path
            '/api/health/',
            '/api-docs/.*',
        ]

    def __call__(self, request):
        path = request.path

        # Use exact match for exempted paths
        for exempt_path in self.exempt_paths:
            if re.fullmatch(exempt_path, path):
                return self.get_response(request)

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
