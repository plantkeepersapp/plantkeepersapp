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



class WateringSchedule(models.Model):
    """
    Model for tracking user plant watering schedules.
    """
    user = models.ForeignKey(UserPlant, on_delete=models.CASCADE, related_name='watering_schedules')
    last_watered = models.DateTimeField(default=timezone.now)
    next_watering_due = models.DateTimeField()
    is_watered = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Watering schedule for {self.plant.name}"
    
    def save(self, *args, **kwargs):
        # Calculate next watering date if not explicitly set
        if not self.next_watering_due:
            water_frequency = self.plant.care.water_frequency
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
    placement = models.CharField(max_length=50, choices=AD_PLACEMENT_CHOICES)
    impression_time = models.DateTimeField(auto_now_add=True)
    device_id = models.CharField(max_length=255, blank=True, null=True)
    estimated_revenue = models.DecimalField(max_digits=10, decimal_places=6, default=0.0)
    
    def __str__(self):
        return f"Ad Impression: {self.ad_id} at {self.impression_time}"

class AdClick(models.Model):
    """
    Model for tracking ad clicks.
    """
    impression = models.ForeignKey(AdImpression, on_delete=models.CASCADE, related_name='clicks')
    click_time = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Click on {self.impression.ad_id} at {self.click_time}"
