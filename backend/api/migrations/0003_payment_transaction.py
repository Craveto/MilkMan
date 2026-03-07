import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_customer_password'),
    ]

    operations = [
        migrations.CreateModel(
            name='PaymentTransaction',
            fields=[
                ('payment_id', models.AutoField(primary_key=True, serialize=False)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(0)])),
                ('currency', models.CharField(default='INR', max_length=10)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('success', 'Success'), ('failed', 'Failed')], default='pending', max_length=20)),
                ('payment_method', models.CharField(choices=[('card', 'Card'), ('upi', 'UPI'), ('netbanking', 'Net Banking')], default='card', max_length=20)),
                ('transaction_reference', models.CharField(blank=True, default='', max_length=50, unique=True)),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('failure_reason', models.CharField(blank=True, max_length=255, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to='api.customer')),
                ('subscription', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='payments', to='api.subscription')),
            ],
            options={
                'db_table': 'payment_transaction',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='paymenttransaction',
            index=models.Index(fields=['customer', 'status'], name='payment_tra_custome_779457_idx'),
        ),
        migrations.AddIndex(
            model_name='paymenttransaction',
            index=models.Index(fields=['transaction_reference'], name='payment_tra_transac_28f9b9_idx'),
        ),
    ]
