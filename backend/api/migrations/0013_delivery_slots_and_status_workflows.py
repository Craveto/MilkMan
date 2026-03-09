from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


def map_order_statuses(apps, schema_editor):
    Order = apps.get_model('api', 'Order')
    Order.objects.filter(status='pending').update(status='placed')
    Order.objects.filter(status='paid').update(status='confirmed')


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_order_discount_amount_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='customeraddress',
            name='delivery_slot',
            field=models.CharField(choices=[('morning', 'Morning'), ('evening', 'Evening')], default='morning', max_length=20),
        ),
        migrations.AddField(
            model_name='order',
            name='delivered_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='delivery_address',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='orders', to='api.customeraddress'),
        ),
        migrations.AddField(
            model_name='order',
            name='delivery_date',
            field=models.DateField(default=django.utils.timezone.localdate),
        ),
        migrations.AddField(
            model_name='order',
            name='delivery_slot',
            field=models.CharField(choices=[('morning', 'Morning'), ('evening', 'Evening')], default='morning', max_length=20),
        ),
        migrations.AddField(
            model_name='subscriptiondelivery',
            name='delivery_address',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='subscription_deliveries', to='api.customeraddress'),
        ),
        migrations.AddField(
            model_name='subscriptiondelivery',
            name='delivery_slot',
            field=models.CharField(choices=[('morning', 'Morning'), ('evening', 'Evening')], default='morning', max_length=20),
        ),
        migrations.AlterField(
            model_name='order',
            name='status',
            field=models.CharField(choices=[('placed', 'Placed'), ('confirmed', 'Confirmed'), ('packed', 'Packed'), ('out_for_delivery', 'Out For Delivery'), ('delivered', 'Delivered'), ('failed', 'Failed')], default='placed', max_length=20),
        ),
        migrations.AlterField(
            model_name='subscriptiondelivery',
            name='status',
            field=models.CharField(choices=[('scheduled', 'Scheduled'), ('packed', 'Packed'), ('out_for_delivery', 'Out For Delivery'), ('delivered', 'Delivered'), ('missed', 'Missed'), ('skipped', 'Skipped')], default='scheduled', max_length=20),
        ),
        migrations.RunPython(map_order_statuses, migrations.RunPython.noop),
    ]
