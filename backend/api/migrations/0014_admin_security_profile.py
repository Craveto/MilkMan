from django.db import migrations, models
import django.db.models.deletion
from django.utils import timezone


def create_security_profiles(apps, schema_editor):
    Admin = apps.get_model('api', 'Admin')
    AdminSecurityProfile = apps.get_model('api', 'AdminSecurityProfile')
    now = timezone.now()

    for admin in Admin.objects.all().iterator():
        AdminSecurityProfile.objects.get_or_create(
            admin=admin,
            defaults={
                'must_change_password': False,
                'last_password_change_at': now,
                'failed_login_attempts': 0,
                'locked_until': None,
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0013_delivery_slots_and_status_workflows'),
    ]

    operations = [
        migrations.CreateModel(
            name='AdminSecurityProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('must_change_password', models.BooleanField(default=False)),
                ('last_password_change_at', models.DateTimeField(blank=True, null=True)),
                ('failed_login_attempts', models.PositiveIntegerField(default=0)),
                ('locked_until', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('admin', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='security_profile', to='api.admin')),
            ],
            options={
                'db_table': 'admin_security_profile',
            },
        ),
        migrations.RunPython(create_security_profiles, migrations.RunPython.noop),
    ]
