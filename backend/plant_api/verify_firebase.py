from firebase_admin import auth

def verify_token(token):
    """
    Verify the Firebase token and return the user ID if valid.
    """
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        return uid
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None