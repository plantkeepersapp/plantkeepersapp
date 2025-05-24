from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection
import time

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for monitoring the API.
    This endpoint performs basic checks to ensure the API is functioning correctly.
    """
    start_time = time.time()
    
    # Check database connection
    db_ok = False
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_ok = cursor.fetchone()[0] == 1
    except Exception as e:
        db_status = str(e)
    else:
        db_status = "Connected" if db_ok else "Failed"
    
    # Check environment
    from django.conf import settings
    env_status = {
        "debug_mode": settings.DEBUG,
        "allowed_hosts": settings.ALLOWED_HOSTS,
        "cors_origins": getattr(settings, 'CORS_ALLOWED_ORIGINS', []),
    }
    
    # Response time
    response_time = time.time() - start_time
    
    return Response({
        "status": "healthy" if db_ok else "unhealthy",
        "database": db_status,
        "environment": env_status,
        "response_time_seconds": response_time,
        "timestamp": time.time(),
        "version": "1.0.0"
    })
