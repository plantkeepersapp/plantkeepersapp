from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views_health import health_check

# Setup DRF router for our ViewSets
router = DefaultRouter()
router.register(r'plants', views.PlantViewSet)
router.register(r'plant-care', views.PlantCareViewSet)
router.register(r'watering-schedules', views.WateringScheduleViewSet)
router.register(r'ad-impressions', views.AdImpressionViewSet)
router.register(r'ad-clicks', views.AdClickViewSet)
router.register(r'userplants', views.UserPlantViewSet, basename='userplant')
router.register(r'user', views.UserViewSet)

# URL patterns for plant API
urlpatterns = [
    # Router generated URLs
    path('', include(router.urls)),
    
    # Health check endpoint
    path('health/', health_check, name='health-check'),
    
    # Custom API endpoints
    path('care-summary/', views.PlantCareView.as_view(), name='plant-care-summary'),
    
    # Ad tracking endpoints
    path('track-impression/', views.track_ad_impression, name='track-ad-impression'),
    path('track-click/', views.track_ad_click, name='track-ad-click'),
    
    # AdMob test endpoints

]