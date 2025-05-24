from django.http import JsonResponse

def welcome(request):
    """
    Welcome page for the API root
    """
    return JsonResponse({
        "message": "Welcome to PlantKeepers API",
        "status": "online",
        "version": "1.0.0",
        "documentation": "/api-docs/",
        "health": "/api/health/",
        "endpoints": {
            "plants": "/api/plants/",
            "plant_care": "/api/plant-care/",
            "userplants": "/api/userplants/",
            "users": "/api/user/",
            "watering_schedules": "/api/watering-schedules/",
            "admob_config": "/api/admob-config/"
        }
    })
