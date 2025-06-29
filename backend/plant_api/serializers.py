from rest_framework import serializers
from .models import ActiveUser, Plant, PlantCare, AdImpression, AdClick, AdUnit, AdRevenue, AdKpi
from rest_framework.validators import UniqueValidator


class PlantCareSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlantCare
        fields = [
            'id',
            'name',
            'scientific_name',
            'water_frequency',
            'light_requirements',
            'humidity_level',
            'temperature_range',
            'soil_type',
            'fertilizer_frequency',
            'care_summary',
            'last_updated',
        ]
        read_only_fields = ['last_updated']

class PlantSerializer(serializers.ModelSerializer):
    care = PlantCareSerializer(read_only=True)

    class Meta:
        model = Plant
        fields = [
            'id',
            'name',
            'description',
            'image_url',
            'uid',
            'care',
            'created_at',
            'updated_at',
            'last_watered',
            'last_fertilized',
        ]
        read_only_fields = ['created_at', 'updated_at']

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

class ActiveUserSerializer(serializers.ModelSerializer):
    """
    Serializer for tracking daily active users.
    """
    username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = ActiveUser
        fields = ['uid', 'date', 'last_active_time', 'session_count']
        read_only_fields = ['date']

class AdKpiSerializer(serializers.ModelSerializer):
    """
    Serializer for ad KPI metrics.
    """
    target_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = AdKpi
        fields = [
            'id', 'date', 'active_users', 'total_impressions', 'impressions_per_user',
            'estimated_revenue', 'estimated_arpu', 'target_achieved', 'target_percentage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'target_percentage']
    
    def get_target_percentage(self, obj):
        """
        Calculate percentage of target achieved (target is 50 impressions per user)
        """
        if obj.impressions_per_user > 0:
            return min(100, round((obj.impressions_per_user / 50) * 100, 1))
        return 0