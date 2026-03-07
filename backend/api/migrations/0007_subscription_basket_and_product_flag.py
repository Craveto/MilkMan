from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_backfill_admin_ownership'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='subscription_only',
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name='SubscriptionBasketItem',
            fields=[
                ('basket_item_id', models.AutoField(primary_key=True, serialize=False)),
                ('quantity', models.IntegerField(default=1, validators=[django.core.validators.MinValueValidator(1)])),
                ('frequency', models.CharField(choices=[('daily', 'Daily'), ('alternate', 'Alternate Days'), ('weekly', 'Weekly')], default='daily', max_length=20)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='subscription_basket', to='api.customer')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='subscription_basket_items', to='api.product')),
            ],
            options={
                'db_table': 'subscription_basket_item',
                'ordering': ['-updated_at'],
                'unique_together': {('customer', 'product', 'is_active')},
            },
        ),
    ]

