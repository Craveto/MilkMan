from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_subscription_basket_and_product_flag'),
    ]

    operations = [
        migrations.CreateModel(
            name='SubscriptionDelivery',
            fields=[
                ('delivery_id', models.AutoField(primary_key=True, serialize=False)),
                ('scheduled_for', models.DateField()),
                ('status', models.CharField(choices=[('scheduled', 'Scheduled'), ('delivered', 'Delivered'), ('missed', 'Missed'), ('skipped', 'Skipped')], default='scheduled', max_length=20)),
                ('delivered_at', models.DateTimeField(blank=True, null=True)),
                ('notes', models.CharField(blank=True, max_length=255, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='subscription_deliveries', to='api.customer')),
                ('subscription', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='deliveries', to='api.subscription')),
            ],
            options={
                'db_table': 'subscription_delivery',
                'ordering': ['-scheduled_for'],
                'unique_together': {('customer', 'scheduled_for')},
            },
        ),
        migrations.CreateModel(
            name='SubscriptionDeliveryItem',
            fields=[
                ('delivery_item_id', models.AutoField(primary_key=True, serialize=False)),
                ('product_name', models.CharField(max_length=200)),
                ('quantity', models.IntegerField(default=1, validators=[django.core.validators.MinValueValidator(1)])),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('delivery', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='api.subscriptiondelivery')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='subscription_delivery_items', to='api.product')),
            ],
            options={
                'db_table': 'subscription_delivery_item',
                'ordering': ['delivery_item_id'],
                'unique_together': {('delivery', 'product')},
            },
        ),
        migrations.AddIndex(
            model_name='subscriptiondelivery',
            index=models.Index(fields=['customer', 'scheduled_for'], name='api_subscrip_customer_3104e8_idx'),
        ),
        migrations.AddIndex(
            model_name='subscriptiondelivery',
            index=models.Index(fields=['scheduled_for', 'status'], name='api_subscrip_schedule_6f1a43_idx'),
        ),
    ]

