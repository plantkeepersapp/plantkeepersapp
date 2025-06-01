from django.db import models
from django.utils import timezone
from decimal import Decimal
from django.db import models

class PlantCare(models.Model):
    """
    Model for plant care information, describing species-level data.
    """
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, help_text="Common name of the plant species")
    scientific_name = models.CharField(max_length=255, blank=True, null=True)
    water_frequency = models.IntegerField(help_text="Watering frequency in days")
    light_requirements = models.CharField(max_length=100, help_text="Light requirements (e.g., Full sun, Partial shade)")
    humidity_level = models.CharField(max_length=100, blank=True, null=True)
    temperature_range = models.CharField(max_length=100, blank=True, null=True)
    soil_type = models.CharField(max_length=100, blank=True, null=True)
    fertilizer_frequency = models.CharField(max_length=100, blank=True, null=True)
    care_summary = models.TextField(blank=True, null=True)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Plant(models.Model):
    """
    Model for a user's plant instance.
    """
    name = models.CharField(max_length=255, help_text="Custom name for the plant given by the user")
    care = models.ForeignKey(PlantCare, on_delete=models.CASCADE, related_name='plants', null=True)
    description = models.TextField(blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    uid = models.CharField(max_length=500, null=True, help_text="Firebase UID to identify the user")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_watered = models.DateTimeField(blank=True, null=True)
    last_fertilized = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return self.name

class AdUnit(models.Model):
    """
    Model for AdMob ad units configuration.
    """
    AD_FORMAT_CHOICES = [
        ('banner', 'Banner Ad'),
        ('interstitial', 'Interstitial Ad'),
        ('rewarded', 'Rewarded Ad'),
        ('native', 'Native Ad'),
    ]
    
    AD_PLACEMENT_CHOICES = [
        ('home_banner', 'Home Banner'),
        ('plant_detail', 'Plant Detail Page'),
        ('care_tips', 'Care Tips Section'),
        ('settings', 'Settings Page'),
    ]
    
    name = models.CharField(max_length=100)
    format = models.CharField(max_length=20, choices=AD_FORMAT_CHOICES)
    placement = models.CharField(max_length=50, choices=AD_PLACEMENT_CHOICES)
    unit_id_android = models.CharField(max_length=255, help_text="AdMob ad unit ID for Android")
    unit_id_ios = models.CharField(max_length=255, help_text="AdMob ad unit ID for iOS", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_test = models.BooleanField(default=True, help_text="Is this a test ad unit?")
    refresh_rate = models.IntegerField(default=60, help_text="Ad refresh rate in seconds (for banner ads)")
    targeting_keywords = models.JSONField(default=list, blank=True, null=True, help_text="Keywords for ad targeting")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.format} - {self.placement})"

class AdImpression(models.Model):
    """
    Model for tracking ad impressions.
    """
    AD_PLACEMENT_CHOICES = [
        ('home_banner', 'Home Banner'),
        ('plant_detail', 'Plant Detail Page'),
        ('care_tips', 'Care Tips Section'),
        ('settings', 'Settings Page'),
    ]
    
    ad_id = models.CharField(max_length=255)
    ad_network = models.CharField(max_length=100, default='AdMob')
    ad_unit = models.ForeignKey(AdUnit, on_delete=models.SET_NULL, null=True, blank=True, related_name='impressions')
    placement = models.CharField(max_length=50, choices=AD_PLACEMENT_CHOICES)
    impression_time = models.DateTimeField(auto_now_add=True)
    device_id = models.CharField(max_length=255, blank=True, null=True)
    device_platform = models.CharField(max_length=20, default='android')
    device_model = models.CharField(max_length=100, blank=True, null=True)
    uid = models.CharField(max_length=500, null=True, help_text="Firebase UID to identify the user")
    estimated_revenue = models.DecimalField(max_digits=10, decimal_places=6, default=0.0)
    is_test_ad = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True, null=True)
    
    def __str__(self):
        return f"Ad Impression: {self.ad_id} at {self.impression_time}"

class AdClick(models.Model):
    """
    Model for tracking ad clicks.
    """
    impression = models.ForeignKey(AdImpression, on_delete=models.CASCADE, related_name='clicks')
    click_time = models.DateTimeField(auto_now_add=True)
    conversion_type = models.CharField(max_length=50, blank=True, null=True)
    conversion_value = models.DecimalField(max_digits=10, decimal_places=6, default=0.0)
    
    def __str__(self):
        return f"Click on {self.impression.ad_id} at {self.click_time}"

class AdRevenue(models.Model):
    """
    Model for tracking ad revenue data from AdMob.
    """
    ad_unit = models.ForeignKey(AdUnit, on_delete=models.CASCADE, related_name='revenue')
    date = models.DateField()
    impressions = models.IntegerField(default=0)
    clicks = models.IntegerField(default=0)
    revenue = models.DecimalField(max_digits=10, decimal_places=6, default=0.0)
    ecpm = models.DecimalField(max_digits=10, decimal_places=6, default=0.0, help_text="Effective Cost Per Mille")
    fill_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0, help_text="Ad fill rate percentage")
    
    class Meta:
        unique_together = ['ad_unit', 'date']
        
    def __str__(self):
        return f"Revenue for {self.ad_unit.name} on {self.date}: ${self.revenue}"

class ApiUsage(models.Model):
    """
    Model for tracking API usage (OpenAI, Plant APIs, etc.)
    """
    api_name = models.CharField(max_length=100)
    endpoint = models.CharField(max_length=255)
    request_time = models.DateTimeField(auto_now_add=True)
    response_time = models.IntegerField(help_text="Response time in milliseconds")
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.api_name} - {self.endpoint} - {self.request_time}"

class ActiveUser(models.Model):
    """
    Model for tracking daily active users.
    """
    uid = models.CharField(max_length=500, null=True, help_text="Firebase UID to identify the user")
    date = models.DateField(default=timezone.now)
    last_active_time = models.DateTimeField(default=timezone.now)
    session_count = models.IntegerField(default=1)
    
    class Meta:
        unique_together = ['uid', 'date']
        
    def __str__(self):
        return f"{self.user.username} active on {self.date}"

class AdKpi(models.Model):
    """
    Model for tracking KPI metrics related to ad impressions and active users.
    
    KPI: Ad impressions per active user per day (directly tied to revenue model)
    Target: 50 ad impressions per active user per day
    Estimated revenue: $0.005 per impression, targeting $0.25 ARPU
    """
    date = models.DateField(unique=True)
    active_users = models.IntegerField(default=0)
    total_impressions = models.IntegerField(default=0)
    impressions_per_user = models.FloatField(default=0.0)
    estimated_revenue = models.DecimalField(max_digits=10, decimal_places=6, default=0.0)
    estimated_arpu = models.DecimalField(max_digits=10, decimal_places=6, default=0.0, 
                                         help_text="Average Revenue Per User")
    target_achieved = models.BooleanField(default=False, 
                                          help_text="Whether target of 50 impressions per user was achieved")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Ad KPI for {self.date}: {self.impressions_per_user:.1f} impressions per user"
    
    def save(self, *args, **kwargs):
        # Calculate impressions per user
        if self.active_users > 0:
            self.impressions_per_user = self.total_impressions / self.active_users
        else:
            self.impressions_per_user = 0
            
        # Calculate estimated revenue ($0.005 per impression)
        self.estimated_revenue = Decimal(self.total_impressions) * Decimal('0.005')
        
        # Calculate ARPU (Average Revenue Per User)
        if self.active_users > 0:
            self.estimated_arpu = self.estimated_revenue / Decimal(self.active_users)
        else:
            self.estimated_arpu = Decimal('0.0')
            
        # Check if target is achieved (50 impressions per user)
        self.target_achieved = self.impressions_per_user >= 50.0
            
        super().save(*args, **kwargs)
