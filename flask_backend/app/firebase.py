import firebase_admin
from firebase_admin import credentials
import os

_initialized = False

def get_db():
    global _initialized
    if not _initialized:
        cred = credentials.Certificate(
            os.path.join(os.path.dirname(__file__), '..', 'firebase-key.json')
        )
        firebase_admin.initialize_app(cred)
        _initialized = True

    from firebase_admin import firestore
    return firestore.client()