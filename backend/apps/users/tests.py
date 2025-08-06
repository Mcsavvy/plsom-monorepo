from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from apps.users.models import User as UserModel

User = get_user_model()


class UserProfilePictureTestCase(APITestCase):
    def setUp(self):
        self.user: UserModel = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
            role="student",
        )
        self.client.force_authenticate(user=self.user)

    def create_test_image(self, filename="test.jpg", content_type="image/jpeg"):
        """Helper method to create a test image file"""
        # Create a simple test image (1x1 pixel JPEG)
        image_data = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9"

        return SimpleUploadedFile(
            filename, image_data, content_type=content_type
        )

    def test_upload_profile_picture_success(self):
        """Test successful profile picture upload"""
        url = reverse("user-upload-profile-picture")

        image_file = self.create_test_image()
        data = {"profile_picture": image_file}

        response = self.client.post(url, data, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("profile_picture", response.data)

        # Verify the user's profile picture was updated
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.profile_picture)

    def test_upload_profile_picture_invalid_file_type(self):
        """Test profile picture upload with invalid file type"""
        url = reverse("user-upload-profile-picture")

        # Create a text file instead of image
        text_file = SimpleUploadedFile(
            "test.txt", b"this is not an image", content_type="text/plain"
        )
        data = {"profile_picture": text_file}

        response = self.client.post(url, data, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("profile_picture", response.data)

    def test_upload_profile_picture_file_too_large(self):
        """Test profile picture upload with file too large"""
        url = reverse("user-upload-profile-picture")

        # Create a large file (6MB)
        large_data = b"x" * (6 * 1024 * 1024)
        large_file = SimpleUploadedFile(
            "large.jpg", large_data, content_type="image/jpeg"
        )
        data = {"profile_picture": large_file}

        response = self.client.post(url, data, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("profile_picture", response.data)

    def test_upload_profile_picture_unauthenticated(self):
        """Test profile picture upload without authentication"""
        self.client.force_authenticate(user=None)

        url = reverse("user-upload-profile-picture")
        image_file = self.create_test_image()
        data = {"profile_picture": image_file}

        response = self.client.post(url, data, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_upload_profile_picture_replaces_existing(self):
        """Test that uploading a new profile picture replaces the old one"""
        url = reverse("user-upload-profile-picture")

        # Upload first image
        image1 = self.create_test_image("image1.jpg")
        data1 = {"profile_picture": image1}
        response1 = self.client.post(url, data1, format="multipart")
        self.assertEqual(response1.status_code, status.HTTP_200_OK)

        # Get the first image path
        self.user.refresh_from_db()
        first_image_path = self.user.profile_picture.path

        # Upload second image
        image2 = self.create_test_image("image2.jpg")
        data2 = {"profile_picture": image2}
        response2 = self.client.post(url, data2, format="multipart")
        self.assertEqual(response2.status_code, status.HTTP_200_OK)

        # Verify the old file was deleted and new one was saved
        self.user.refresh_from_db()
        self.assertNotEqual(first_image_path, self.user.profile_picture.path)

    def test_delete_profile_picture_success(self):
        """Test successful profile picture deletion"""
        # First upload a profile picture
        url_upload = reverse("user-upload-profile-picture")
        image_file = self.create_test_image()
        data = {"profile_picture": image_file}
        self.client.post(url_upload, data, format="multipart")

        # Now delete it
        url_delete = reverse("user-delete-profile-picture")
        response = self.client.delete(url_delete)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify the profile picture was deleted
        self.user.refresh_from_db()
        self.assertFalse(bool(self.user.profile_picture))

    def test_delete_profile_picture_no_picture(self):
        """Test deleting profile picture when user has no picture"""
        url = reverse("user-delete-profile-picture")
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_delete_profile_picture_unauthenticated(self):
        """Test profile picture deletion without authentication"""
        self.client.force_authenticate(user=None)

        url = reverse("user-delete-profile-picture")
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
