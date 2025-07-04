# Generated by Django 5.2.1 on 2025-06-02 15:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='username',
        ),
        migrations.AddField(
            model_name='user',
            name='title',
            field=models.CharField(blank=True, choices=[('Mr', 'Mr'), ('Mrs', 'Mrs'), ('Dr', 'Dr'), ('Prof', 'Prof'), ('Ms', 'Ms'), ('Miss', 'Miss'), ('Rev', 'Rev'), ('Min', 'Minister'), ('Pastor', 'Pastor'), ('Apostle', 'Apostle'), ('Bishop', 'Bishop'), ('Evangelist', 'Evangelist'), ('Deacon', 'Deacon'), ('Elder', 'Elder')], max_length=20, null=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(max_length=254, unique=True),
        ),
    ]
