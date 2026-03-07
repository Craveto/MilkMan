from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_order_orderitem_orderpayment'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='owner_admin',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='categories',
                to='api.admin',
            ),
        ),
        migrations.AddField(
            model_name='customer',
            name='owner_admin',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='customers',
                to='api.admin',
            ),
        ),
        migrations.AddField(
            model_name='subscription',
            name='owner_admin',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='subscriptions',
                to='api.admin',
            ),
        ),
    ]
