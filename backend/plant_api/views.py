import time
import json
import os
from datetime import datetime
import requests
from decimal import Decimal

from django.conf import settings
from django.utils import timezone
from rest_framework import viewsets, status, views
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from openai import OpenAI

from .models import Plant, PlantCare, WateringSchedule, AdImpression, AdClick, ApiUsage
from .serializers import (
    PlantSerializer, PlantCareSerializer, WateringScheduleSerializer,
    AdImpressionSerializer, AdClickSerializer, PlantCareSummarySerializer
)

# Initialize OpenAI client
client = OpenAI(api_key=settings.OPENAI_API_KEY)

# Plant API configurations - using Perenual and Trefle as our two reliable plant APIs
PERENUAL_API_KEY = os.getenv('PERENUAL_API_KEY', '')
TREFLE_API_KEY = os.getenv('TREFLE_API_KEY', '')

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

class AdImpressionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for tracking ad impressions
    """
    queryset = AdImpression.objects.all()
    serializer_class = AdImpressionSerializer

class AdClickViewSet(viewsets.ModelViewSet):
    """
    API endpoint for tracking ad clicks
    """
    queryset = AdClick.objects.all()
    serializer_class = AdClickSerializer

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
                model="gpt-4_1-nano-2025-04-14",
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

@api_view(['POST'])
def track_ad_impression(request):
    """
    API endpoint to track ad impressions
    """
    serializer = AdImpressionSerializer(data=request.data)
    
    if serializer.is_valid():
        impression = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def track_ad_click(request):
    """
    API endpoint to track ad clicks
    """
    # Extract impression_id from request data
    impression_id = request.data.get('impression_id')
    
    try:
        impression = AdImpression.objects.get(id=impression_id)
        click = AdClick.objects.create(impression=impression)
        serializer = AdClickSerializer(click)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except AdImpression.DoesNotExist:
        return Response(
            {"error": f"Ad impression with ID {impression_id} does not exist"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
