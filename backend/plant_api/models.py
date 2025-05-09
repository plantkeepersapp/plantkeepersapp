from django.db import models
from django.utils import timezone

class Plant(models.Model):
    """
    Model for plant basic information.
    """
    name = models.CharField(max_length=255)
    scientific_name = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class PlantCare(models.Model):
    """
    Model for plant care information.
    """
    plant = models.OneToOneField(Plant, on_delete=models.CASCADE, related_name='care')
    water_frequency = models.IntegerField(help_text="Watering frequency in days")
    light_requirements = models.CharField(max_length=100, help_text="Light requirements (e.g., Full sun, Partial shade)")
    humidity_level = models.CharField(max_length=100, blank=True, null=True)
    temperature_range = models.CharField(max_length=100, blank=True, null=True)
    soil_type = models.CharField(max_length=100, blank=True, null=True)
    fertilizer_frequency = models.CharField(max_length=100, blank=True, null=True)
    care_summary = models.TextField(blank=True, null=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Care for {self.plant.name}"

class User(models.Model):
    """
    Model for User tracing, with enforcing the uniqueness of username and email
    """
    birthname = models.TextField(blank=True, null=True)
    username = models.TextField(blank=True, null=True, unique=True)
    email = models.EmailField(blank=True, null=True, unique=True)
    createdat = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.username}"

class UserPlant(models.Model):
    """
    Model for tracking user's plants.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_plants')
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE, related_name='user_plants')
    added = models.DateField(auto_now_add=True)
    last_watered = models.DateField(blank=True, null=True)
    last_fertilized = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s {self.plant.name}"

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
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ad_impressions')
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

class WateringSchedule(models.Model):
    """
    Model for tracking user plant watering schedules.
    """
    user = models.ForeignKey(UserPlant, on_delete=models.CASCADE, related_name='watering_schedules')
    last_watered = models.DateTimeField(default=timezone.now)
    next_watering_due = models.DateTimeField()
    is_watered = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Watering schedule for {self.user.plant.name}"
    
    def save(self, *args, **kwargs):
        # Calculate next watering date if not explicitly set
        if not self.next_watering_due:
            # Get water_frequency from the plant's care info
            water_frequency = self.user.plant.care.water_frequency if hasattr(self.user.plant, 'care') else 7
            self.next_watering_due = self.last_watered + timezone.timedelta(days=water_frequency)
        super().save(*args, **kwargs)

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
