from rest_framework import serializers
from .models import Plant, PlantCare, WateringSchedule, AdImpression, AdClick, UserPlant, User, AdUnit, AdRevenue
from rest_framework.validators import UniqueValidator


class PlantCareSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlantCare
        fields = ['id', 'water_frequency', 'light_requirements', 'care_summary']

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

class AdUnitSerializer(serializers.ModelSerializer):
    """
    Serializer for AdMob ad units configuration.
    """
    class Meta:
        model = AdUnit
        fields = [
            'id', 'name', 'format', 'placement', 'unit_id_android', 'unit_id_ios', 
            'is_active', 'is_test', 'refresh_rate', 'targeting_keywords', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class AdClickSerializer(serializers.ModelSerializer):
    """
    Serializer for tracking ad clicks.
    """
    class Meta:
        model = AdClick
        fields = ['id', 'impression', 'click_time', 'conversion_type', 'conversion_value']
        read_only_fields = ['click_time']

class AdImpressionSerializer(serializers.ModelSerializer):
    """
    Serializer for ad impressions with nested clicks.
    """
    clicks = AdClickSerializer(many=True, read_only=True)
    ad_unit_name = serializers.ReadOnlyField(source='ad_unit.name', default=None)
    
    class Meta:
        model = AdImpression
        fields = [
            'id', 'ad_id', 'ad_network', 'ad_unit', 'ad_unit_name', 'placement', 
            'impression_time', 'device_id', 'device_platform', 'device_model', 'user',
            'estimated_revenue', 'is_test_ad', 'metadata', 'clicks'
        ]
        read_only_fields = ['impression_time']

class AdRevenueSerializer(serializers.ModelSerializer):
    """
    Serializer for AdMob revenue data.
    """
    ad_unit_name = serializers.ReadOnlyField(source='ad_unit.name')
    ad_format = serializers.ReadOnlyField(source='ad_unit.format')
    
    class Meta:
        model = AdRevenue
        fields = [
            'id', 'ad_unit', 'ad_unit_name', 'ad_format', 'date', 'impressions', 
            'clicks', 'revenue', 'ecpm', 'fill_rate'
        ]
                  
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