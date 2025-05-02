from rest_framework import serializers
from .models import Plant, PlantCare, WateringSchedule, AdImpression, AdClick, UserPlant, User
from rest_framework.validators import UniqueValidator


class PlantCareSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlantCare
        fields = ['id', 'plant', 'water_frequency', 'light_requirements', 'humidity_level', 
                  'temperature_range', 'soil_type', 'fertilizer_frequency', 'care_summary']

class PlantSerializer(serializers.ModelSerializer):
    care = PlantCareSerializer(read_only=True)
    
    class Meta:
        model = Plant
        fields = ['id', 'name', 'scientific_name', 'description', 'image_url', 'care']

class WateringScheduleSerializer(serializers.ModelSerializer):
    plant_name = serializers.ReadOnlyField(source='plant.name')
    
    class Meta:
        model = WateringSchedule
        fields = ['id', 'plant', 'plant_name', 'last_watered', 'next_watering_due', 'is_watered']

class AdClickSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdClick
        fields = ['id', 'impression', 'click_time']

class AdImpressionSerializer(serializers.ModelSerializer):
    clicks = AdClickSerializer(many=True, read_only=True)
    
    class Meta:
        model = AdImpression
        fields = ['id', 'ad_id', 'ad_network', 'placement', 
                  'impression_time', 'device_id', 'estimated_revenue', 'clicks']
                  
class PlantCareSummarySerializer(serializers.Serializer):
    """
    Serializer for the plant care summary generated with OpenAI.
    """
    plant_name = serializers.CharField(required=True)
    plant_type = serializers.CharField(required=False, allow_blank=True)
    watering_needs = serializers.CharField(required=False)
    light_needs = serializers.CharField(required=False)
    summary = serializers.CharField(required=False)
    tips = serializers.ListField(child=serializers.CharField(), required=False)

class UserPlantSerializer(serializers.ModelSerializer):
    plant_name = serializers.ReadOnlyField(source='plant.name')
    
    class Meta:
        model = UserPlant
        fields = ['id', 'user', 'plant', 'plant_name', 'added', 'last_watered', 'last_fertilized']
        read_only_fields = ['added']

class UserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )

    email = serializers.EmailField(
        required=False,
        allow_null=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )

    class Meta:
        model = User
        fields = [
            'id',
            'birthname',   # Optional read-only field
            'username',
            'email',      # Optional read-only field
            'createdat',
        ]
        read_only_fields = ['createdat']