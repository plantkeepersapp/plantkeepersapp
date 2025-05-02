from django.test import TestCase
from .models import User


class UserModelTest(TestCase):

    def test_user_creation(self):
        user = User.objects.create(
            birthname="John Smith",
            username="johnsmith",
            email="john@example.com"
        )
        self.assertEqual(user.username, "johnsmith")
        self.assertEqual(str(user), "johnsmith")
        self.assertIsNotNone(user.createdat)