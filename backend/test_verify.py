from django.test import TestCase, Client

client = Client()
response = client.get('/api/plants/', HTTP_AUTHORIZATION='Bearer invalidtoken')
print(response)