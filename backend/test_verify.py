import requests
from dotenv import load_dotenv
import os

# Replace these with your test user credentials and Firebase API key
EMAIL = "User email"
PASSWORD = "User password"
API_KEY = "API HERE" #It is in  the Environment Variables in the .env file, Somehow I could not get it to work with dotenv

DJANGO_TEST_URL = "http://127.0.0.1:8000/api/userplants/"  # Your Django endpoint


def get_firebase_token(email, password, api_key):
    """Sign in via Firebase and get ID token"""
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        return response.json()["idToken"]
    else:
        print("Failed to sign in:", response.json())
        return None


def test_django_endpoint(id_token):
    """Send request to Django with ID token"""
    headers = {
        "Authorization": f"Bearer {id_token}"
    }
    response = requests.get(DJANGO_TEST_URL, headers=headers)
    print("Status code:", response.status_code)
    print("Response:", response.json())


if __name__ == "__main__":
    token = get_firebase_token(EMAIL, PASSWORD, API_KEY)
    if token:
        print("✅ Got Firebase token, testing Django endpoint...")
        test_django_endpoint(token)
    else:
        print("❌ Failed to get Firebase token.")