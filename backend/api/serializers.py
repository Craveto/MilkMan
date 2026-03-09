from rest_framework import serializers
from django.utils import timezone
from .models import (
    Admin, Category, Subscription, Customer, Product, SubscriptionBasketItem,
    SubscriptionDelivery, SubscriptionDeliveryItem,
    PaymentTransaction, Order, OrderItem, OrderPayment,
    CustomerAddress,
    AdminSignupApplication,
    AdminSecurityProfile,
    UserNotification,
)


# ======================== ADMIN SERIALIZER ========================
class AdminSerializer(serializers.ModelSerializer):
    """Serializer for Admin model"""
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)
    must_change_password = serializers.SerializerMethodField()
    failed_login_attempts = serializers.SerializerMethodField()
    locked_until = serializers.SerializerMethodField()
    
    class Meta:
        model = Admin
        fields = [
            'admin_id', 'first_name', 'last_name', 'email', 'phone',
            'username', 'password', 'role', 'is_active',
            'must_change_password', 'failed_login_attempts', 'locked_until',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['admin_id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Extract password and hash it when creating
        password = validated_data.pop('password', None)
        admin = Admin(**validated_data)
        must_change_password = False
        if password:
            admin.set_password(password)
        else:
            admin.set_password('DefaultPassword123!')  # Fallback if no password provided
            must_change_password = True
        admin.save()
        AdminSecurityProfile.objects.update_or_create(
            admin=admin,
            defaults={
                'must_change_password': must_change_password,
                'last_password_change_at': timezone.now(),
                'failed_login_attempts': 0,
                'locked_until': None,
            },
        )
        return admin
    
    def update(self, instance, validated_data):
        # Hash password when updating if provided
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if password:
            AdminSecurityProfile.objects.update_or_create(
                admin=instance,
                defaults={
                    'must_change_password': False,
                    'last_password_change_at': timezone.now(),
                    'failed_login_attempts': 0,
                    'locked_until': None,
                },
            )
        return instance

    def get_must_change_password(self, obj):
        profile, _ = AdminSecurityProfile.objects.get_or_create(admin=obj)
        return profile.must_change_password

    def get_failed_login_attempts(self, obj):
        profile, _ = AdminSecurityProfile.objects.get_or_create(admin=obj)
        return profile.failed_login_attempts

    def get_locked_until(self, obj):
        profile, _ = AdminSecurityProfile.objects.get_or_create(admin=obj)
        return profile.locked_until


class AdminSignupApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminSignupApplication
        fields = [
            'application_id',
            'first_name', 'last_name', 'email', 'phone',
            'shop_name', 'shop_address', 'gst_number', 'notes',
            'status', 'reviewed_by', 'reviewed_at', 'decision_note',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'application_id', 'status', 'reviewed_by', 'reviewed_at',
            'decision_note', 'created_at', 'updated_at',
        ]

# ======================== CATEGORY SERIALIZER ========================
class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""
    
    class Meta:
        model = Category
        fields = ['category_id', 'name', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['category_id', 'created_at', 'updated_at']


# ======================== SUBSCRIPTION SERIALIZER ========================
class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for Subscription model"""
    
    class Meta:
        model = Subscription
        fields = [
            'subscription_id', 'name', 'description', 'price', 'billing_cycle',
            'duration_days', 'product_discount_percent', 'includes_delivery_scheduling',
            'suppress_daily_payments', 'max_products', 'features', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['subscription_id', 'created_at', 'updated_at']


# ======================== CUSTOMER SERIALIZER ========================
class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for Customer model"""
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)
    subscription_name = serializers.CharField(
        source='subscription.name',
        read_only=True
    )
    
    class Meta:
        model = Customer
        fields = [
            'customer_id', 'first_name', 'last_name', 'email', 'phone',
            'username',
            'password',
            'address', 'city', 'state', 'postal_code', 'country',
            'subscription', 'subscription_name', 'subscription_start_date',
            'subscription_end_date', 'status', 'is_verified',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['customer_id', 'created_at', 'updated_at']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        customer = Customer(**validated_data)
        if password:
            customer.set_password(password)
        else:
            customer.set_password('DefaultPassword123!')
        customer.save()
        return customer

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# ======================== PRODUCT SERIALIZER ========================
class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model"""
    category_name = serializers.CharField(
        source='category.name',
        read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.username',
        read_only=True,
        required=False
    )
    
    class Meta:
        model = Product
        fields = [
            'product_id', 'name', 'description', 'category', 'category_name',
            'price', 'cost', 'quantity_in_stock', 'sku', 'status',
            'is_featured', 'subscription_only', 'rating', 'tags', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['product_id', 'created_at', 'updated_at', 'created_by', 'created_by_name']
    
    def create(self, validated_data):
        return super().create(validated_data)
    
    def validate_price(self, value):
        """Validate price is positive"""
        if value < 0:
            raise serializers.ValidationError("Price must be positive")
        return value
    
    def validate_quantity_in_stock(self, value):
        """Validate quantity is not negative"""
        if value < 0:
            raise serializers.ValidationError("Quantity cannot be negative")
        return value


# ======================== NESTED SERIALIZERS FOR RELATIONSHIPS ========================

class ProductDetailSerializer(serializers.ModelSerializer):
    """Detailed product serializer with category info"""
    category_name = serializers.CharField(
        source='category.name',
        read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.username',
        read_only=True
    )
    
    class Meta:
        model = Product
        fields = [
            'product_id', 'name', 'description', 'category', 'category_name',
            'price', 'cost', 'quantity_in_stock', 'sku', 'status',
            'is_featured', 'subscription_only', 'rating', 'tags', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['product_id', 'created_at', 'updated_at', 'category_name', 'created_by_name']


class SubscriptionBasketItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = SubscriptionBasketItem
        fields = [
            'basket_item_id', 'product', 'product_name', 'product_price',
            'quantity', 'frequency', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['basket_item_id', 'created_at', 'updated_at']


class SubscriptionDeliveryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionDeliveryItem
        fields = ['delivery_item_id', 'product', 'product_name', 'quantity', 'created_at']
        read_only_fields = ['delivery_item_id', 'created_at']


class SubscriptionDeliverySerializer(serializers.ModelSerializer):
    items = SubscriptionDeliveryItemSerializer(many=True, read_only=True)
    customer_name = serializers.SerializerMethodField()
    delivery_address_label = serializers.CharField(source='delivery_address.label', read_only=True)
    delivery_address_line1 = serializers.CharField(source='delivery_address.line1', read_only=True)

    class Meta:
        model = SubscriptionDelivery
        fields = [
            'delivery_id', 'customer', 'customer_name', 'subscription',
            'delivery_address', 'delivery_address_label', 'delivery_address_line1',
            'delivery_slot', 'scheduled_for', 'status', 'delivered_at', 'notes',
            'created_at', 'updated_at', 'items',
        ]
        read_only_fields = ['delivery_id', 'created_at', 'updated_at', 'customer_name', 'items']

    def get_customer_name(self, obj):
        try:
            return f"{obj.customer.first_name} {obj.customer.last_name}".strip()
        except Exception:
            return ""


class CustomerDetailSerializer(serializers.ModelSerializer):
    """Detailed customer serializer with subscription info"""
    subscription = SubscriptionSerializer(read_only=True)
    
    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['customer_id', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True},
        }


class CustomerAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAddress
        fields = [
            'address_id', 'customer',
            'label', 'line1', 'line2', 'city', 'state', 'postal_code', 'country',
            'delivery_slot', 'is_default',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['address_id', 'customer', 'created_at', 'updated_at']


class UserNotificationSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = UserNotification
        fields = [
            'notification_id', 'notification_type', 'title', 'message',
            'product', 'product_name', 'metadata', 'is_read', 'created_at',
        ]
        read_only_fields = fields


class PaymentTransactionSerializer(serializers.ModelSerializer):
    """Serializer for payment transaction model"""
    customer_name = serializers.SerializerMethodField()
    subscription_name = serializers.CharField(source='subscription.name', read_only=True)

    class Meta:
        model = PaymentTransaction
        fields = [
            'payment_id', 'customer', 'customer_name', 'subscription', 'subscription_name',
            'amount', 'currency', 'status', 'payment_method', 'transaction_reference',
            'paid_at', 'failure_reason', 'created_at'
        ]
        read_only_fields = ['payment_id', 'transaction_reference', 'paid_at', 'created_at']

    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}".strip()


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['order_item_id', 'product', 'product_name', 'quantity', 'unit_price', 'line_total']


class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    items = OrderItemSerializer(many=True, read_only=True)
    delivery_address_label = serializers.CharField(source='delivery_address.label', read_only=True)
    delivery_address_line1 = serializers.CharField(source='delivery_address.line1', read_only=True)

    class Meta:
        model = Order
        fields = [
            'order_id', 'customer', 'customer_name',
            'delivery_address', 'delivery_address_label', 'delivery_address_line1',
            'delivery_date', 'delivery_slot',
            'subtotal', 'discount_amount', 'tax_amount',
            'total_amount', 'currency', 'status', 'delivered_at',
            'created_at', 'updated_at', 'items'
        ]

    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}".strip()


class OrderPaymentSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.order_id', read_only=True)

    class Meta:
        model = OrderPayment
        fields = [
            'order_payment_id', 'order_id', 'amount', 'currency', 'status', 'payment_method',
            'transaction_reference', 'paid_at', 'failure_reason', 'created_at'
        ]
