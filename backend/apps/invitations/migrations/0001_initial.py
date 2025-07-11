# Generated by Django 5.2.1 on 2025-06-02 01:43

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies: list[str] = [
    ]

    operations = [
        migrations.CreateModel(
            name='Invitation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(max_length=254)),
                ('role', models.CharField(choices=[('admin', 'Admin'), ('lecturer', 'Lecturer'), ('student', 'Student')], max_length=20)),
                ('program_type', models.CharField(choices=[('certificate', 'Certificate'), ('diploma', 'Diploma')], max_length=20, null=True)),
                ('token', models.UUIDField(default=uuid.uuid4, unique=True)),
                ('expires_at', models.DateTimeField()),
                ('used_at', models.DateTimeField(null=True)),
            ],
        ),
    ]
