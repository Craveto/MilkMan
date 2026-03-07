from django.db import migrations


def backfill_owner_admin(apps, schema_editor):
    Admin = apps.get_model('api', 'Admin')
    Category = apps.get_model('api', 'Category')
    Subscription = apps.get_model('api', 'Subscription')
    Customer = apps.get_model('api', 'Customer')

    owner = Admin.objects.filter(role='super_admin', is_active=True).order_by('admin_id').first()
    if owner is None:
        owner = Admin.objects.filter(is_active=True).order_by('admin_id').first()
    if owner is None:
        return

    Category.objects.filter(owner_admin__isnull=True).update(owner_admin=owner)
    Subscription.objects.filter(owner_admin__isnull=True).update(owner_admin=owner)
    Customer.objects.filter(owner_admin__isnull=True).update(owner_admin=owner)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_admin_ownership_scope'),
    ]

    operations = [
        migrations.RunPython(backfill_owner_admin, migrations.RunPython.noop),
    ]

