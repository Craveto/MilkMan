from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_subscription_delivery_models'),
    ]

    operations = [
        migrations.AddField(
            model_name='customer',
            name='username',
            field=models.CharField(
                blank=True,
                max_length=50,
                null=True,
                unique=True,
                validators=[django.core.validators.RegexValidator('^[a-zA-Z0-9_]{3,50}$', 'Invalid username')],
            ),
        ),
        migrations.CreateModel(
            name='CustomerAddress',
            fields=[
                ('address_id', models.AutoField(primary_key=True, serialize=False)),
                ('label', models.CharField(blank=True, max_length=50, null=True)),
                ('line1', models.CharField(max_length=255)),
                ('line2', models.CharField(blank=True, max_length=255, null=True)),
                ('city', models.CharField(blank=True, max_length=100, null=True)),
                ('state', models.CharField(blank=True, max_length=50, null=True)),
                ('postal_code', models.CharField(blank=True, max_length=20, null=True)),
                ('country', models.CharField(blank=True, max_length=100, null=True)),
                ('is_default', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='addresses', to='api.customer')),
            ],
            options={
                'db_table': 'customer_address',
                'ordering': ['-is_default', '-updated_at', '-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='customeraddress',
            index=models.Index(fields=['customer', 'is_default'], name='customer_ad_custome_b6dca3_idx'),
        ),
    ]
