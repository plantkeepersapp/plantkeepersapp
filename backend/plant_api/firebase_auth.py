from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from .verify_firebase import verify_token
from .models import User  # Import your custom User model

class FirebaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        id_token = auth_header.split(' ')[1]
        uid = verify_token(id_token)
        if not uid:
            raise exceptions.AuthenticationFailed('Invalid Firebase token')
        # You can return a Django user instance here if you want
        user, created = User.objects.get_or_create(username=uid)
        return (user, None)