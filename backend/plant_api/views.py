import time
import json
import os
from datetime import datetime, timedelta
import requests
from decimal import Decimal
import uuid
import logging

from django.conf import settings
from django.utils import timezone
from django.db.models import Sum, Count, Avg, F, FloatField, ExpressionWrapper
from rest_framework import viewsets, status, views
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from openai import OpenAI

from .models import (
    Plant, PlantCare, WateringSchedule, AdImpression, AdClick, ApiUsage, UserPlant, User,
    AdUnit, AdRevenue, ActiveUser, AdKpi
)
from .serializers import (
    PlantSerializer, PlantCareSerializer, WateringScheduleSerializer,
    AdImpressionSerializer, AdClickSerializer, PlantCareSummarySerializer, UserPlantSerializer, 
    UserSerializer, AdUnitSerializer, AdRevenueSerializer, ActiveUserSerializer, AdKpiSerializer
)

# Initialize logger
logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=settings.OPENAI_API_KEY)

# Plant API configurations - using Perenual and Trefle as our two reliable plant APIs
PERENUAL_API_KEY = os.getenv('PERENUAL_API_KEY', '')
TREFLE_API_KEY = os.getenv('TREFLE_API_KEY', '')

# AdMob configuration 
ADMOB_CONFIG = settings.ADMOB_CONFIG

class PlantViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing plants
    """
    queryset = Plant.objects.all()
    serializer_class = PlantSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """
        Override retrieve method to ensure plants have care information
        """
        instance = self.get_object()
        
        # Check if the plant has care information
        try:
            care = instance.care
            if not care:
                raise PlantCare.DoesNotExist
        except (PlantCare.DoesNotExist, AttributeError):
            # No care information exists, so generate it
            plant_name = instance.name
            print(f"Generating care info for {plant_name}")
            
            # Get info from external APIs
            perenual_data = PlantInfoAPI.get_plant_info_from_perenual(plant_name)
            trefle_data = PlantInfoAPI.get_plant_info_from_trefle(plant_name)
            
            # Combine data
            combined_info = {
                "perenual_data": perenual_data[:1] if perenual_data else [],
                "trefle_data": trefle_data[:1] if trefle_data else []
            }
            print(f"Combined info: {combined_info}")
            # Generate care summary
            care_summary = PlantCareAI.generate_plant_care_summary(plant_name, combined_info)
            print(f"Care summary: {care_summary}")
            # If successful, create plant care info
            if care_summary and 'error' not in care_summary:
                # Update plant description if it's empty
                if not instance.description and care_summary.get('summary'):
                    instance.description = care_summary.get('summary')
                    instance.save()
                
                # Create plant care info
                PlantCare.objects.create(
                    plant=instance,
                    water_frequency=7,  # Default to weekly
                    light_requirements=care_summary.get('light_needs', ''),
                    humidity_level=care_summary.get('humidity_needs', ''),
                    soil_type=care_summary.get('soil_needs', ''),
                    care_summary=care_summary.get('summary', '')
                )
                
                # Refresh the instance to get the updated data
                instance = self.get_object()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def list(self, request, *args, **kwargs):
        """
        Override list method to ensure all plants have care information
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        # Check each plant for care information and generate if missing
        plants_to_update = []
        for plant in queryset:
            try:
                care = plant.care
                if not care:
                    plants_to_update.append(plant)
            except (PlantCare.DoesNotExist, AttributeError):
                plants_to_update.append(plant)
        
        # Generate care data for plants missing it
        for plant in plants_to_update:
            plant_name = plant.name
            print(f"Generating care info for {plant_name} during list operation")
            
            care_summary = PlantCareAI.generate_plant_care_summary(plant_name)
            
            # Update plant info
            if not plant.description and care_summary.get('summary'):
                plant.description = care_summary.get('summary')
                plant.save()
            
            # Create plant care info
            PlantCare.objects.create(
                plant=plant,
                water_frequency=7,
                light_requirements=care_summary.get('light_needs', ''),
                care_summary=care_summary.get('summary', '')
            )
        
        # Now continue with standard pagination and serialization
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class PlantCareViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing plant care information
    """
    queryset = PlantCare.objects.all()
    serializer_class = PlantCareSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Override create method to handle custom care generation
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get the plant
        plant_id = request.data.get('plant')
        if not plant_id:
            return Response({"error": "Plant ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            plant = Plant.objects.get(id=plant_id)
            
            # Generate care summary using our AI service
            care_summary = PlantCareAI.generate_plant_care_summary(plant.name)
            
            # Update serializer data with AI-generated info
            validated_data = serializer.validated_data
            if not validated_data.get('light_requirements') and care_summary.get('light_needs'):
                validated_data['light_requirements'] = care_summary.get('light_needs')
                
            if not validated_data.get('care_summary') and care_summary.get('summary'):
                validated_data['care_summary'] = care_summary.get('summary')
                
            # Set water frequency if not provided
            if not validated_data.get('water_frequency'):
                validated_data['water_frequency'] = 7  # Default weekly
                
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Plant.DoesNotExist:
            return Response({"error": f"Plant with ID {plant_id} does not exist"}, 
                           status=status.HTTP_404_NOT_FOUND)
    
    def perform_create(self, serializer):
        serializer.save()

class WateringScheduleViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing watering schedules
    """
    queryset = WateringSchedule.objects.all()
    serializer_class = WateringScheduleSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def get_queryset(self):
        # Optional: filter schedules to only show for logged-in user
        return WateringSchedule.objects.filter(plant__user=self.request.user)

class AdUnitViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing AdMob ad units
    """
    queryset = AdUnit.objects.all()
    serializer_class = AdUnitSerializer
    
    @action(detail=False, methods=['get'])
    def active_ad_units(self, request):
        """
        Get all active ad units, optionally filtered by format and placement
        """
        format_type = request.query_params.get('format')
        placement = request.query_params.get('placement')
        platform = request.query_params.get('platform', 'android')  # default to android
        
        queryset = AdUnit.objects.filter(is_active=True)
        
        if format_type:
            queryset = queryset.filter(format=format_type)
        
        if placement:
            queryset = queryset.filter(placement=placement)
        
        serializer = self.get_serializer(queryset, many=True)
        
        # Enhance response with the appropriate unit IDs for the platform
        response_data = []
        for item in serializer.data:
            item_copy = dict(item)
            item_copy['unit_id'] = item_copy['unit_id_android'] if platform == 'android' else item_copy['unit_id_ios']
            
            # If in test mode, override with test ad unit IDs
            if item_copy['is_test']:
                ad_format = item_copy['format']
                if ad_format == 'banner':
                    item_copy['unit_id'] = ADMOB_CONFIG['TEST_BANNER_AD_UNIT_ID']
                elif ad_format == 'interstitial':
                    item_copy['unit_id'] = ADMOB_CONFIG['TEST_INTERSTITIAL_AD_UNIT_ID']
                elif ad_format == 'rewarded':
                    item_copy['unit_id'] = ADMOB_CONFIG['TEST_REWARDED_AD_UNIT_ID']
            
            response_data.append(item_copy)
        
        return Response(response_data)
    
    @action(detail=False, methods=['get'])
    def app_config(self, request):
        """
        Get AdMob app configuration for the specified platform
        """
        platform = request.query_params.get('platform', 'android')
        
        app_id = ADMOB_CONFIG['APP_ID_ANDROID'] if platform == 'android' else ADMOB_CONFIG['APP_ID_IOS']
        test_mode = ADMOB_CONFIG['TEST_MODE']
        
        # Get banner ad units for home and plant detail
        home_banner = AdUnit.objects.filter(
            format='banner', 
            placement='home_banner', 
            is_active=True
        ).first()
        
        plant_detail_banner = AdUnit.objects.filter(
            format='banner', 
            placement='plant_detail', 
            is_active=True
        ).first()
        
        # Get interstitial ad unit
        interstitial = AdUnit.objects.filter(
            format='interstitial',
            is_active=True
        ).first()
        
        config = {
            'app_id': app_id,
            'test_mode': test_mode,
            'ad_units': {
                'home_banner': home_banner.unit_id_android if platform == 'android' and home_banner else None,
                'plant_detail': plant_detail_banner.unit_id_android if platform == 'android' and plant_detail_banner else None,
                'interstitial': interstitial.unit_id_android if platform == 'android' and interstitial else None,
            }
        }
        
        # If in test mode, use test ad unit IDs
        if test_mode:
            config['ad_units'] = {
                'home_banner': ADMOB_CONFIG['TEST_BANNER_AD_UNIT_ID'],
                'plant_detail': ADMOB_CONFIG['TEST_BANNER_AD_UNIT_ID'],
                'interstitial': ADMOB_CONFIG['TEST_INTERSTITIAL_AD_UNIT_ID'],
                'rewarded': ADMOB_CONFIG['TEST_REWARDED_AD_UNIT_ID'],
            }
        
        return Response(config)

class AdImpressionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for tracking ad impressions
    """
    queryset = AdImpression.objects.all()
    serializer_class = AdImpressionSerializer

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get ad impression statistics over time
        """
        days = int(request.query_params.get('days', 30))
        
        # Get start date (30 days ago by default)
        start_date = timezone.now() - timedelta(days=days)
        
        # Get aggregated statistics
        stats = self.get_queryset().filter(impression_time__gte=start_date).aggregate(
            total_impressions=Count('id'),
            total_clicks=Count('clicks'),
            total_revenue=Sum('estimated_revenue'),
        )
        
        # Get daily impressions
        daily_impressions = []
        current_date = start_date.date()
        today = timezone.now().date()
        
        while current_date <= today:
            day_impressions = self.get_queryset().filter(
                impression_time__date=current_date
            ).count()
            
            daily_impressions.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'impressions': day_impressions
            })
            
            current_date += timedelta(days=1)
        
        # Format response
        response_data = {
            'summary': {
                'total_impressions': stats['total_impressions'] or 0,
                'total_clicks': stats['total_clicks'] or 0,
                'total_revenue': float(stats['total_revenue'] or 0),
                'click_through_rate': (stats['total_clicks'] / stats['total_impressions']) * 100 if stats['total_impressions'] else 0,
            },
            'daily_impressions': daily_impressions
        }
        
        return Response(response_data)

class AdClickViewSet(viewsets.ModelViewSet):
    """
    API endpoint for tracking ad clicks
    """
    queryset = AdClick.objects.all()
    serializer_class = AdClickSerializer

class AdRevenueViewSet(viewsets.ModelViewSet):
    """
    API endpoint for tracking ad revenue
    """
    queryset = AdRevenue.objects.all()
    serializer_class = AdRevenueSerializer
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get ad revenue summary statistics
        """
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days)
        
        # Get aggregate revenue data
        queryset = self.get_queryset().filter(date__gte=start_date)
        
        total_revenue = queryset.aggregate(
            revenue=Sum('revenue'),
            impressions=Sum('impressions'),
            clicks=Sum('clicks'),
        )
        
        # Get revenue by ad unit
        revenue_by_unit = []
        ad_units = AdUnit.objects.filter(revenue__date__gte=start_date).distinct()
        
        for ad_unit in ad_units:
            unit_data = AdRevenue.objects.filter(
                ad_unit=ad_unit,
                date__gte=start_date
            ).aggregate(
                revenue=Sum('revenue'),
                impressions=Sum('impressions'),
                clicks=Sum('clicks'),
            )
            
            revenue_by_unit.append({
                'ad_unit_id': ad_unit.id,
                'ad_unit_name': ad_unit.name,
                'format': ad_unit.format,
                'placement': ad_unit.placement,
                'revenue': float(unit_data['revenue'] or 0),
                'impressions': unit_data['impressions'] or 0,
                'clicks': unit_data['clicks'] or 0,
            })
        
        # Format response
        response_data = {
            'summary': {
                'period_days': days,
                'total_revenue': float(total_revenue['revenue'] or 0),
                'total_impressions': total_revenue['impressions'] or 0,
                'total_clicks': total_revenue['clicks'] or 0,
                'average_daily_revenue': float(total_revenue['revenue'] or 0) / days,
                'click_through_rate': ((total_revenue['clicks'] or 0) / (total_revenue['impressions'] or 1)) * 100,
            },
            'revenue_by_unit': revenue_by_unit,
        }
        
        return Response(response_data)

    @action(detail=False, methods=['post'])
    def process_admob_report(self, request):
        """
        Process AdMob revenue report (this would typically come from a scheduled task)
        """
        # In a real implementation, this would parse AdMob API reports
        # For demonstration, we'll create sample revenue data
        
        report_date = request.data.get('date', timezone.now().date().isoformat())
        try:
            report_date = datetime.strptime(report_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Get active ad units
        ad_units = AdUnit.objects.filter(is_active=True)
        
        for ad_unit in ad_units:
            # In a real implementation, get actual data from AdMob API
            # For demo, generate random stats
            import random
            
            impressions = random.randint(50, 500)
            clicks = random.randint(0, max(1, int(impressions * 0.05)))  # 0-5% CTR
            revenue = round(random.uniform(0.5, 5.0) * clicks, 6)  # $0.50-$5.00 per click
            ecpm = round((revenue / impressions) * 1000, 6) if impressions else 0
            fill_rate = round(random.uniform(70, 100), 2)  # 70-100% fill rate
            
            # Create or update revenue record
            AdRevenue.objects.update_or_create(
                date=report_date,
                ad_unit=ad_unit,
                defaults={
                    'impressions': impressions,
                    'clicks': clicks,
                    'revenue': revenue,
                    'ecpm': ecpm,
                    'fill_rate': fill_rate,
                }
            )
        
        return Response({
            "message": f"Revenue data processed for {len(ad_units)} ad units on {report_date}",
            "date": report_date,
            "units_processed": [unit.name for unit in ad_units],
        })

class PlantInfoAPI:
    """
    Integration with external plant APIs (Perenual and Trefle)
    """
    @staticmethod
    def get_plant_info_from_perenual(plant_name):
        """
        Get plant information from Perenual API
        """
        start_time = time.time()
        success = True
        error_message = None
        
        try:
            url = f"https://perenual.com/api/species-list?key={PERENUAL_API_KEY}&q={plant_name}"
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            
            # Log API usage
            ApiUsage.objects.create(
                api_name="Perenual",
                endpoint=f"species-list?q={plant_name}",
                response_time=int((time.time() - start_time) * 1000),
                success=success,
                error_message=error_message
            )
            
            return data.get('data', [])
        except Exception as e:
            success = False
            error_message = str(e)
            
            # Log failed API usage
            ApiUsage.objects.create(
                api_name="Perenual",
                endpoint=f"species-list?q={plant_name}",
                response_time=int((time.time() - start_time) * 1000),
                success=success,
                error_message=error_message
            )
            return []

    @staticmethod
    def get_plant_info_from_trefle(plant_name):
        """
        Get plant information from Trefle API
        """
        start_time = time.time()
        success = True
        error_message = None
        
        try:
            url = f"https://trefle.io/api/v1/plants/search?token={TREFLE_API_KEY}&q={plant_name}"
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            
            # Log API usage
            ApiUsage.objects.create(
                api_name="Trefle",
                endpoint=f"plants/search?q={plant_name}",
                response_time=int((time.time() - start_time) * 1000),
                success=success,
                error_message=error_message
            )
            
            return data.get('data', [])
        except Exception as e:
            success = False
            error_message = str(e)
            
            # Log failed API usage
            ApiUsage.objects.create(
                api_name="Trefle",
                endpoint=f"plants/search?q={plant_name}",
                response_time=int((time.time() - start_time) * 1000),
                success=success,
                error_message=error_message
            )
            return []

class AdMobAPI:
    """
    Integration with AdMob API for ad serving and reporting
    """
    @staticmethod
    def get_ad_config(platform='android', format='banner', placement='home_banner'):
        """
        Get ad configuration for the app
        """
        try:
            # First try to get a specific ad unit
            ad_unit = AdUnit.objects.filter(
                format=format,
                placement=placement,
                is_active=True
            ).first()
            
            # If no specific ad unit, try to get any active ad unit of that format
            if not ad_unit:
                ad_unit = AdUnit.objects.filter(
                    format=format,
                    is_active=True
                ).first()
            
            # Build response
            config = {
                'app_id': ADMOB_CONFIG['APP_ID_ANDROID'] if platform == 'android' else ADMOB_CONFIG['APP_ID_IOS'],
                'test_mode': ADMOB_CONFIG['TEST_MODE'],
            }
            
            if ad_unit:
                # Use selected ad unit
                unit_id = ad_unit.unit_id_android if platform == 'android' else ad_unit.unit_id_ios
                
                # Override with test ad if in test mode
                if ADMOB_CONFIG['TEST_MODE'] or ad_unit.is_test:
                    if format == 'banner':
                        unit_id = ADMOB_CONFIG['TEST_BANNER_AD_UNIT_ID']
                    elif format == 'interstitial':
                        unit_id = ADMOB_CONFIG['TEST_INTERSTITIAL_AD_UNIT_ID']
                    elif format == 'rewarded':
                        unit_id = ADMOB_CONFIG['TEST_REWARDED_AD_UNIT_ID']
                
                config.update({
                    'unit_id': unit_id,
                    'format': ad_unit.format,
                    'refresh_rate': ad_unit.refresh_rate,
                    'targeting_keywords': ad_unit.targeting_keywords,
                })
            else:
                # No valid ad unit found, use test ad units
                test_id = ADMOB_CONFIG['TEST_BANNER_AD_UNIT_ID']  # Default to banner
                if format == 'interstitial':
                    test_id = ADMOB_CONFIG['TEST_INTERSTITIAL_AD_UNIT_ID']
                elif format == 'rewarded':
                    test_id = ADMOB_CONFIG['TEST_REWARDED_AD_UNIT_ID']
                
                config.update({
                    'unit_id': test_id,
                    'format': format,
                    'refresh_rate': 60,
                    'targeting_keywords': [],
                })
            
            return config, True
            
        except Exception as e:
            logger.error(f"Error getting AdMob config: {str(e)}")
            return {
                'error': 'Failed to retrieve ad configuration',
                'message': str(e)
            }, False

    @staticmethod
    def record_ad_impression(ad_unit_id, ad_id, placement, device_info, user_id=None, is_test=True):
        """
        Record an ad impression in the database
        """
        try:
            # Get ad unit if provided
            ad_unit = None
            if ad_unit_id:
                try:
                    ad_unit = AdUnit.objects.get(id=ad_unit_id)
                except AdUnit.DoesNotExist:
                    pass
            
            # Get user if provided
            user = None
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                except User.DoesNotExist:
                    pass
            
            # Create impression record
            impression = AdImpression.objects.create(
                ad_id=ad_id,
                ad_network='AdMob',
                ad_unit=ad_unit,
                placement=placement,
                device_id=device_info.get('device_id'),
                device_platform=device_info.get('platform'),
                device_model=device_info.get('model'),
                user=user,
                is_test_ad=is_test,
                metadata={
                    'app_version': device_info.get('app_version'),
                    'os_version': device_info.get('os_version'),
                }
            )
            
            return impression
            
        except Exception as e:
            logger.error(f"Error recording ad impression: {str(e)}")
            return None

class PlantCareAI:
    """
    Integration with OpenAI for plant care summaries and tips
    """
    @staticmethod
    def generate_plant_care_summary(plant_name, plant_info=None):
        """
        Generate plant care summary using OpenAI GPT model
        """
        start_time = time.time()
        success = True
        error_message = None
        
        # Force fetch from external APIs if no plant info is provided
        if not plant_info or (not plant_info.get('perenual_data') and not plant_info.get('trefle_data')):
            print(f"No plant info provided for {plant_name}, fetching from APIs...")
            perenual_data = PlantInfoAPI.get_plant_info_from_perenual(plant_name)
            trefle_data = PlantInfoAPI.get_plant_info_from_trefle(plant_name)
            
            plant_info = {
                "perenual_data": perenual_data[:1] if perenual_data else [],
                "trefle_data": trefle_data[:1] if trefle_data else []
            }
        
        # Prepare information to include in the prompt
        info_text = "No specific plant information available."
        if plant_info:
            info_text = json.dumps(plant_info, indent=2)
            
        prompt = f"""
        You are a plant care expert assistant. Create a care summary for a {plant_name} plant.
        If available, use this information: {info_text}
        
        Format your response as a JSON object with these fields:
        {{
            "plant_name": "Common name of the plant",
            "scientific_name": "Scientific name if available",
            "watering_needs": "Brief description of watering frequency and amount",
            "light_needs": "Brief description of light requirements",
            "summary": "A brief 2-3 sentence overview of general care",
            "tips": ["Tip 1", "Tip 2", "Tip 3"] (List of 3-5 important care tips)
        }}
        
        Keep the response concise and practical for casual plant owners.
        """
        
        try:
            # If OpenAI API key isn't set, print a warning but still attempt call
            if not settings.OPENAI_API_KEY:
                print("WARNING: No OpenAI API key provided. API call will likely fail.")
            
            # Make the actual API call to OpenAI
            response = client.chat.completions.create(
                model="gpt-4.1-nano-2025-04-14",
                messages=[
                    {"role": "system", "content": "You're a plant care expert assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            # Log API usage
            ApiUsage.objects.create(
                api_name="OpenAI",
                endpoint="chat/completions",
                response_time=int((time.time() - start_time) * 1000),
                success=success,
                error_message=error_message
            )
            
            content = response.choices[0].message.content
            print(f"OpenAI API response received for {plant_name}")
            return json.loads(content)
        except Exception as e:
            success = False
            error_message = str(e)
            print(f"OpenAI API Error: {str(e)}")
            
            # Log failed API usage
            ApiUsage.objects.create(
                api_name="OpenAI",
                endpoint="chat/completions",
                response_time=int((time.time() - start_time) * 1000),
                success=success,
                error_message=error_message
            )
            
            # Return error information
            return {
                "plant_name": plant_name,
                "error": "Failed to generate care summary",
                "message": str(e)
            }

class PlantCareView(views.APIView):
    """
    API view for getting plant care information
    """
    def get(self, request):
        plant_name = request.query_params.get('plant_name', '')
        
        if not plant_name:
            return Response(
                {"error": "Plant name is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to get plant from database first
        plant = Plant.objects.filter(name__icontains=plant_name).first()
        
        if plant and hasattr(plant, 'care'):
            # Return existing plant info
            serializer = PlantSerializer(plant)
            return Response(serializer.data)
        
        # If not in database, try to get info from external APIs
        perenual_data = PlantInfoAPI.get_plant_info_from_perenual(plant_name)
        trefle_data = PlantInfoAPI.get_plant_info_from_trefle(plant_name)
        
        # Combine data and generate care summary using OpenAI
        combined_info = {
            "perenual_data": perenual_data[:1] if perenual_data else [],
            "trefle_data": trefle_data[:1] if trefle_data else []
        }
        
        care_summary = PlantCareAI.generate_plant_care_summary(plant_name, combined_info)
        
        # If we got good data, save it to our database
        if care_summary and 'error' not in care_summary:
            # Create or update plant
            plant, created = Plant.objects.update_or_create(
                name=care_summary.get('plant_name', plant_name),
                defaults={
                    'scientific_name': care_summary.get('scientific_name', ''),
                    'description': care_summary.get('summary', '')
                }
            )
            
            # Create or update plant care info
            PlantCare.objects.update_or_create(
                plant=plant,
                defaults={
                    'water_frequency': 7,  # Default to weekly unless specified
                    'light_requirements': care_summary.get('light_needs', 'Medium light'),
                    'care_summary': care_summary.get('summary', '')
                }
            )
        
        # Return the care summary
        serializer = PlantCareSummarySerializer(data=care_summary)
        if serializer.is_valid():
            return Response(serializer.data)
        else:
            return Response(care_summary)  # Return raw data if serializer validation fails

class AdMobConfigView(views.APIView):
    """
    API view for getting AdMob configuration
    """
    def get(self, request):
        platform = request.query_params.get('platform', 'android')
        ad_format = request.query_params.get('format')
        placement = request.query_params.get('placement')
        
        # Get ad configuration
        config, success = AdMobAPI.get_ad_config(
            platform=platform,
            format=ad_format or 'banner',
            placement=placement or 'home_banner'
        )
        
        if success:
            return Response(config)
        else:
            return Response(config, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def track_ad_impression(request):
    """
    API endpoint to track ad impressions
    """
    try:
        # First, try to use our serializer for validation
        serializer = AdImpressionSerializer(data=request.data)
        
        if serializer.is_valid():
            # Process using the standard serializer approach
            impression = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # If the standard approach didn't work, try the direct approach
        # Extract data from request
        ad_id = request.data.get('ad_id', f"ad-{uuid.uuid4().hex[:8]}")
        ad_network = request.data.get('ad_network', 'AdMob')
        placement = request.data.get('placement', 'home_banner')
        device_id = request.data.get('device_id')
        device_platform = request.data.get('device_platform', 'android')
        is_test_ad = request.data.get('is_test_ad', True)
        
        # Create impression directly
        impression = AdImpression.objects.create(
            ad_id=ad_id,
            ad_network=ad_network,
            placement=placement,
            device_id=device_id,
            device_platform=device_platform,
            is_test_ad=is_test_ad
        )
        
        return Response({
            "id": impression.id,
            "ad_id": impression.ad_id,
            "placement": impression.placement,
            "impression_time": impression.impression_time,
            "message": "Ad impression recorded successfully"
        }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f"Error in track_ad_impression: {str(e)}")
        return Response({
            "error": str(e),
            "message": "Failed to record impression"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def track_ad_click(request):
    """
    API endpoint to track ad clicks
    """
    try:
        # Extract impression_id from request data
        impression_id = request.data.get('impression_id')
        
        if not impression_id:
            return Response({
                "error": "impression_id is required",
                "message": "Please provide a valid impression ID"
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            impression = AdImpression.objects.get(id=impression_id)
            click = AdClick.objects.create(
                impression=impression,
                conversion_type=request.data.get('conversion_type'),
                conversion_value=Decimal(request.data.get('conversion_value', 0.0))
            )
            serializer = AdClickSerializer(click)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except AdImpression.DoesNotExist:
            return Response(
                {"error": f"Ad impression with ID {impression_id} does not exist"},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response(
                {"error": f"Invalid value: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        logger.error(f"Error in track_ad_click: {str(e)}")
        return Response(
            {"error": str(e), "message": "Failed to record ad click"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class UserPlantViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to view or edit their plants.
    """
    queryset = UserPlant.objects.all()
    serializer_class = UserPlantSerializer

    def list(self, request, *args, **kwargs):
        user_id = request.query_params.get('user_id', None)
        if user_id is not None:
            # Filter the queryset by user_id if provided
            queryset = UserPlant.objects.filter(user_id=user_id)
        else:
            # If no user_id is provided, return all records
            queryset = UserPlant.objects.all()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing user's plants.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer

class ActiveUserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for tracking daily active users
    """
    queryset = ActiveUser.objects.all()
    serializer_class = ActiveUserSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Override create to handle updating an existing active user record for today
        """
        user_id = request.data.get('user')
        if not user_id:
            return Response({"error": "User ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        today = timezone.now().date()
        
        # Try to get existing record for today
        try:
            active_user = ActiveUser.objects.get(user_id=user_id, date=today)
            active_user.last_active_time = timezone.now()
            active_user.session_count += 1
            active_user.save()
            serializer = self.get_serializer(active_user)
            return Response(serializer.data)
        except ActiveUser.DoesNotExist:
            # Create new record
            return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get statistics on active users
        """
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days)
        
        # Aggregate data
        stats = self.get_queryset().filter(date__gte=start_date).aggregate(
            total_active_users=Count('user', distinct=True),
            total_sessions=Sum('session_count'),
            avg_daily_active_users=Count('id') / days,
        )
        
        # Get daily active users
        daily_users = []
        current_date = start_date
        today = timezone.now().date()
        
        while current_date <= today:
            day_users = self.get_queryset().filter(date=current_date).count()
            
            daily_users.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'active_users': day_users
            })
            
            current_date += timedelta(days=1)
        
        return Response({
            'summary': {
                'period_days': days,
                'total_active_users': stats['total_active_users'] or 0,
                'total_sessions': stats['total_sessions'] or 0,
                'average_daily_active_users': round(stats['avg_daily_active_users'] or 0, 2),
            },
            'daily_active_users': daily_users
        })

class AdKpiViewSet(viewsets.ModelViewSet):
    """
    API endpoint for ad KPI metrics tracking
    """
    queryset = AdKpi.objects.all()
    serializer_class = AdKpiSerializer

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get summary statistics for ad impression KPI metrics
        """
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days)
        
        # Get aggregate KPI data
        queryset = self.get_queryset().filter(date__gte=start_date)
        
        kpi_summary = queryset.aggregate(
            avg_impressions_per_user=Avg('impressions_per_user'),
            avg_active_users=Avg('active_users'),
            avg_total_impressions=Avg('total_impressions'),
            total_estimated_revenue=Sum('estimated_revenue'),
            avg_arpu=Avg('estimated_arpu'),
            target_achieved_days=Count('id', filter=models.Q(target_achieved=True)),
        )
        
        # Calculate target achievement percentage
        target_achievement_percentage = (kpi_summary['target_achieved_days'] / queryset.count()) * 100 if queryset.count() > 0 else 0
        
        # Get daily KPI data
        daily_kpi = []
        for kpi in queryset.order_by('date'):
            daily_kpi.append({
                'date': kpi.date.strftime('%Y-%m-%d'),
                'active_users': kpi.active_users,
                'total_impressions': kpi.total_impressions,
                'impressions_per_user': round(kpi.impressions_per_user, 2),
                'estimated_arpu': float(kpi.estimated_arpu),
                'target_achieved': kpi.target_achieved,
                'target_percentage': round((kpi.impressions_per_user / 50) * 100, 1) if kpi.impressions_per_user > 0 else 0,
            })
        
        # Format response
        response_data = {
            'summary': {
                'period_days': days,
                'period_start': start_date.strftime('%Y-%m-%d'),
                'period_end': timezone.now().date().strftime('%Y-%m-%d'),
                'avg_impressions_per_user': round(kpi_summary['avg_impressions_per_user'] or 0, 2),
                'avg_active_users': round(kpi_summary['avg_active_users'] or 0, 2),
                'avg_daily_impressions': round(kpi_summary['avg_total_impressions'] or 0, 2),
                'total_estimated_revenue': float(kpi_summary['total_estimated_revenue'] or 0),
                'avg_arpu': float(kpi_summary['avg_arpu'] or 0),
                'target': 50,  # 50 impressions per user per day
                'target_achieved_days': kpi_summary['target_achieved_days'] or 0,
                'target_achievement_percentage': round(target_achievement_percentage, 1),
            },
            'daily_kpi': daily_kpi,
        }
        
        return Response(response_data)

    @action(detail=False, methods=['post'])
    def calculate_daily_kpi(self, request):
        """
        Calculate KPI metrics for a specific day (defaults to yesterday)
        """
        # Get date for calculation (default to yesterday)
        date_str = request.data.get('date')
        if date_str:
            try:
                calculation_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, 
                               status=status.HTTP_400_BAD_REQUEST)
        else:
            calculation_date = timezone.now().date() - timedelta(days=1)
        
        # Get active user count for the day
        active_users = ActiveUser.objects.filter(date=calculation_date).count()
        
        # Get total ad impressions for the day
        total_impressions = AdImpression.objects.filter(
            impression_time__date=calculation_date
        ).count()
        
        # Calculate impressions per user
        impressions_per_user = total_impressions / active_users if active_users > 0 else 0
        
        # Calculate estimated revenue ($0.005 per impression)
        estimated_revenue = Decimal(total_impressions) * Decimal('0.005')
        
        # Calculate ARPU
        estimated_arpu = estimated_revenue / Decimal(active_users) if active_users > 0 else Decimal('0.0')
        
        # Check if target is achieved (50 impressions per user)
        target_achieved = impressions_per_user >= 50.0
        
        # Create or update KPI record
        kpi, created = AdKpi.objects.update_or_create(
            date=calculation_date,
            defaults={
                'active_users': active_users,
                'total_impressions': total_impressions,
                'impressions_per_user': impressions_per_user,
                'estimated_revenue': estimated_revenue,
                'estimated_arpu': estimated_arpu,
                'target_achieved': target_achieved,
            }
        )
        
        serializer = self.get_serializer(kpi)
        return Response(serializer.data)
    @action(detail=False, methods=['post'])
    def calculate_historical_kpi(self, request):
        """
        Calculate KPI metrics for a range of days
        """
        days = int(request.data.get('days', 30))
        end_date = timezone.now().date() - timedelta(days=1)  # Yesterday
        start_date = end_date - timedelta(days=days-1)
        
        results = []
        current_date = start_date
        
        while current_date <= end_date:
            # Get active user count for the day
            active_users = ActiveUser.objects.filter(date=current_date).count()
            
            # Get total ad impressions for the day
            total_impressions = AdImpression.objects.filter(
                impression_time__date=current_date
            ).count()
            
            # Calculate impressions per user
            impressions_per_user = total_impressions / active_users if active_users > 0 else 0
            
            # Calculate estimated revenue ($0.005 per impression)
            estimated_revenue = Decimal(total_impressions) * Decimal('0.005')
            
            # Calculate ARPU
            estimated_arpu = estimated_revenue / Decimal(active_users) if active_users > 0 else Decimal('0.0')
            
            # Check if target is achieved (50 impressions per user)
            target_achieved = impressions_per_user >= 50.0
            
            # Create or update KPI record
            kpi, created = AdKpi.objects.update_or_create(
                date=current_date,
                defaults={
                    'active_users': active_users,
                    'total_impressions': total_impressions,
                    'impressions_per_user': impressions_per_user,
                    'estimated_revenue': estimated_revenue,
                    'estimated_arpu': estimated_arpu,
                    'target_achieved': target_achieved,
                }
            )
            
            results.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'active_users': active_users,
                'total_impressions': total_impressions,
                'impressions_per_user': round(impressions_per_user, 2),
                'estimated_revenue': float(estimated_revenue),
                'estimated_arpu': float(estimated_arpu),
                'target_achieved': target_achieved,
            })
            
            current_date += timedelta(days=1)
        
        return Response({
            'days_processed': len(results),
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'results': results
        })
