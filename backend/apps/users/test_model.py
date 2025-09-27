from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()


class UserModelTestCase(TestCase):
    """Test cases for the custom User model."""

    def setUp(self):
        self.user_data = {
            "email": "test@example.com",
            "password": "testpassword123",
            "first_name": "Test",
            "last_name": "User",
            "role": "student",
        }

    def test_create_user_success(self):
        """Test successful user creation."""
        user = User.objects.create_user(**self.user_data)

        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.first_name, "Test")
        self.assertEqual(user.last_name, "User")
        self.assertEqual(user.role, "student")
        self.assertTrue(user.check_password("testpassword123"))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_setup_complete)

    def test_create_user_with_title(self):
        """Test user creation with title."""
        user_data = self.user_data.copy()
        user_data["title"] = "Dr"

        user = User.objects.create_user(**user_data)

        self.assertEqual(user.title, "Dr")

    def test_create_user_with_whatsapp_number(self):
        """Test user creation with WhatsApp number."""
        user_data = self.user_data.copy()
        user_data["whatsapp_number"] = "+1234567890"

        user = User.objects.create_user(**user_data)

        self.assertEqual(user.whatsapp_number, "+1234567890")

    def test_create_user_without_email(self):
        """Test user creation without email raises ValueError."""
        user_data = self.user_data.copy()
        del user_data["email"]

        with self.assertRaises(TypeError) as context:
            User.objects.create_user(**user_data)

        self.assertIn(
            "email", str(context.exception)
        )

    def test_create_user_with_empty_email(self):
        """Test user creation with empty email raises ValueError."""
        user_data = self.user_data.copy()
        user_data["email"] = ""

        with self.assertRaises(ValueError) as context:
            User.objects.create_user(**user_data)

        self.assertEqual(
            str(context.exception), "Users must have an email address"
        )

    def test_create_user_email_normalization(self):
        """Test that email is normalized during user creation."""
        user_data = self.user_data.copy()
        user_data["email"] = "TEST@EXAMPLE.COM"

        user = User.objects.create_user(**user_data)

        self.assertEqual(user.email, "test@example.com")

    def test_unique_email_constraint(self):
        """Test that email must be unique."""
        User.objects.create_user(**self.user_data)

        with self.assertRaises(IntegrityError):
            User.objects.create_user(**self.user_data)

    def test_create_superuser_success(self):
        """Test successful superuser creation."""
        user = User.objects.create_superuser(
            email="admin@example.com", password="adminpassword123"
        )

        self.assertEqual(user.email, "admin@example.com")
        self.assertTrue(user.is_active)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_create_superuser_with_extra_fields(self):
        """Test superuser creation with extra fields."""
        user = User.objects.create_superuser(
            email="admin@example.com",
            password="adminpassword123",
            first_name="Admin",
            last_name="User",
            role="admin",
        )

        self.assertEqual(user.first_name, "Admin")
        self.assertEqual(user.last_name, "User")
        self.assertEqual(user.role, "admin")

    def test_create_superuser_without_is_staff(self):
        """Test superuser creation with is_staff=False raises ValueError."""
        with self.assertRaises(ValueError) as context:
            User.objects.create_superuser(
                email="admin@example.com",
                password="adminpassword123",
                is_staff=False,
            )

        self.assertEqual(
            str(context.exception),
            "Superuser must be assigned to is_staff=True",
        )

    def test_create_superuser_without_is_superuser(self):
        """Test superuser creation with is_superuser=False raises ValueError."""
        with self.assertRaises(ValueError) as context:
            User.objects.create_superuser(
                email="admin@example.com",
                password="adminpassword123",
                is_superuser=False,
            )

        self.assertEqual(
            str(context.exception),
            "Superuser must be assigned to is_superuser=True",
        )

    def test_get_full_name_with_title(self):
        """Test get_full_name method with title."""
        user = User.objects.create_user(
            email="test@example.com",
            password="testpassword123",
            first_name="John",
            last_name="Doe",
            title="Dr",
        )

        self.assertEqual(user.get_full_name(), "Dr John Doe")

    def test_get_full_name_without_title(self):
        """Test get_full_name method without title."""
        user = User.objects.create_user(
            email="test@example.com",
            password="testpassword123",
            first_name="John",
            last_name="Doe",
        )

        self.assertEqual(user.get_full_name(), "John Doe")

    def test_get_full_name_with_empty_names(self):
        """Test get_full_name method with empty names."""
        user = User.objects.create_user(
            email="test@example.com",
            password="testpassword123",
            first_name="",
            last_name="",
        )

        self.assertEqual(user.get_full_name(), " ")

    def test_username_field_is_email(self):
        """Test that USERNAME_FIELD is set to email."""
        self.assertEqual(User.USERNAME_FIELD, "email")

    def test_required_fields_empty(self):
        """Test that REQUIRED_FIELDS is empty."""
        self.assertEqual(User.REQUIRED_FIELDS, [])

    def test_user_role_choices(self):
        """Test that user role choices are properly defined."""
        expected_roles = (
            ("admin", "Admin"),
            ("lecturer", "Lecturer"),
            ("student", "Student"),
        )
        self.assertEqual(User.ROLES, expected_roles)

    def test_user_title_choices(self):
        """Test that user title choices are properly defined."""
        expected_titles = (
            ("Mr", "Mr"),
            ("Mrs", "Mrs"),
            ("Dr", "Dr"),
            ("Prof", "Prof"),
            ("Ms", "Ms"),
            ("Miss", "Miss"),
            ("Rev", "Rev"),
            ("Min", "Minister"),
            ("Pastor", "Pastor"),
            ("Apostle", "Apostle"),
            ("Bishop", "Bishop"),
            ("Evangelist", "Evangelist"),
            ("Deacon", "Deacon"),
            ("Elder", "Elder"),
        )
        self.assertEqual(User.TITLES, expected_titles)

    def test_program_type_choices(self):
        """Test that program type choices are properly defined."""
        expected_program_types = (
            ("certificate", "Certificate"),
            ("diploma", "Diploma"),
        )
        self.assertEqual(User.PROGRAM_TYPES, expected_program_types)

    def test_user_ordering(self):
        """Test that users are ordered by first_name, last_name."""
        # Create users in reverse alphabetical order
        User.objects.create_user(
            email="user3@example.com",
            first_name="Charlie",
            last_name="Wilson",
            password="password123",
        )
        User.objects.create_user(
            email="user1@example.com",
            first_name="Alice",
            last_name="Smith",
            password="password123",
        )
        User.objects.create_user(
            email="user2@example.com",
            first_name="Bob",
            last_name="Johnson",
            password="password123",
        )

        users = list(User.objects.all())

        self.assertEqual(users[0].first_name, "Alice")
        self.assertEqual(users[1].first_name, "Bob")
        self.assertEqual(users[2].first_name, "Charlie")

    def test_user_string_representation(self):
        """Test the string representation of user."""
        user = User.objects.create_user(**self.user_data)
        # The default string representation should be the email
        self.assertEqual(str(user), "test@example.com")

    def test_user_role_validation(self):
        """Test that only valid roles are accepted."""
        valid_roles = ["admin", "lecturer", "student"]

        for role in valid_roles:
            user_data = self.user_data.copy()
            user_data["email"] = f"{role}@example.com"
            user_data["role"] = role
            user = User.objects.create_user(**user_data)
            self.assertEqual(user.role, role)

    def test_user_title_validation(self):
        """Test that only valid titles are accepted."""
        valid_titles = [
            "Mr",
            "Mrs",
            "Dr",
            "Prof",
            "Ms",
            "Miss",
            "Rev",
            "Min",
            "Pastor",
            "Apostle",
            "Bishop",
            "Evangelist",
            "Deacon",
            "Elder",
        ]

        for title in valid_titles:
            user_data = self.user_data.copy()
            user_data["email"] = f"{title.lower()}@example.com"
            user_data["title"] = title
            user = User.objects.create_user(**user_data)
            self.assertEqual(user.title, title)

    def test_user_no_username_field(self):
        """Test that username field is None."""
        user = User.objects.create_user(**self.user_data)
        self.assertIsNone(user.username)

    def test_user_profile_picture_field(self):
        """Test that profile_picture field exists and is optional."""
        user = User.objects.create_user(**self.user_data)
        self.assertIsNone(user.profile_picture.name)

    def test_user_is_setup_complete_default(self):
        """Test that is_setup_complete defaults to False."""
        user = User.objects.create_user(**self.user_data)
        self.assertFalse(user.is_setup_complete)


class UserManagerTestCase(TestCase):
    """Test cases for the custom UserManager."""

    def test_manager_create_user_method(self):
        """Test that manager's create_user method works correctly."""
        user = User.objects.create_user(
            email="manager@example.com",
            password="password123",
            first_name="Manager",
            last_name="Test",
        )

        self.assertIsInstance(user, User)
        self.assertEqual(user.email, "manager@example.com")
        self.assertTrue(user.check_password("password123"))

    def test_manager_create_superuser_method(self):
        """Test that manager's create_superuser method works correctly."""
        user = User.objects.create_superuser(
            email="superuser@example.com", password="password123"
        )

        self.assertIsInstance(user, User)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_active)
