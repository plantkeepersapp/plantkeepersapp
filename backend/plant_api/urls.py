from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Setup DRF router for our ViewSets
router = DefaultRouter()
router.register(r'plants', views.PlantViewSet)
router.register(r'ad-impressions', views.AdImpressionViewSet)
router.register(r'ad-clicks', views.AdClickViewSet)
router.register(r'userplants', views.UserPlantViewSet, basename='userplants')
router.register(r'user', views.UserViewSet)

# URL patterns for plant API
urlpatterns = [
    # Router generated URLs
    path('', include(router.urls)),
    
    # Custom API endpoints
    path('care-summary/', views.PlantCareView.as_view(), name='plant-care-summary'),
    
    # Ad tracking endpoints
    path('track-impression/', views.track_ad_impression, name='track-ad-impression'),
    path('track-click/', views.track_ad_click, name='track-ad-click'),
    
    # AdMob test endpoints
    path('admob-config/', views.get_admob_config, name='admob-config'),
    path('test-ad-request/', views.test_ad_request, name='test-ad-request'),
]