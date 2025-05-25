import firebase_admin
from firebase_admin import credentials
import os
from django.conf import settings
cred_path = os.path.join(
    os.path.dirname(__file__),
    settings.FIREBASE_CREDENTIALS)

if not firebase_admin._apps:
    cred = credentials.Certificate(os.path.abspath(cred_path))
    firebase_admin.initialize_app(cred)