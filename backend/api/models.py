from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.utils import timezone
from django.contrib.auth.hashers import make_password
import uuid

# ======================== ADMIN MODEL ========================
class Admin(models.Model):
    """Admin user model with comprehensive constraints"""
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('admin', 'Admin'),
        ('manager', 'Manager'),
    ]
    
    admin_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100, blank=False, null=False)
    last_name = models.CharField(max_length=100, blank=False, null=False)
    email = models.EmailField(unique=True, null=False, blank=False)
    phone = models.CharField(
        max_length=15,
        validators=[RegexValidator(r'^\+?1?\d{9,15}$', 'Invalid phone number')],
        null=False,
        blank=False
    )
    username = models.CharField(max_length=50, unique=True, null=False, blank=False)
    password = models.CharField(max_length=255, null=False, blank=False)  # Stores hashed password
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='admin')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'admin'
        ordering = ['admin_id']
    
    def set_password(self, raw_password):
        """Hash and set the password"""
        self.password = make_password(raw_password)
    
    def check_password(self, raw_password):
        """Check if raw password matches hashed password"""
        from django.contrib.auth.hashers import check_password as django_check_password
        if not self.password:
            return False
        try:
            return django_check_password(raw_password, self.password)
        except Exception:
            return False
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"


class AdminSecurityProfile(models.Model):
    admin = models.OneToOneField('Admin', on_delete=models.CASCADE, related_name='security_profile')
    must_change_password = models.BooleanField(default=False)
    last_password_change_at = models.DateTimeField(null=True, blank=True)
    failed_login_attempts = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'admin_security_profile'

    def __str__(self):
        return f"AdminSecurityProfile({self.admin_id})"


# ======================== ADMIN SIGNUP APPLICATION ========================
class AdminSignupApplication(models.Model):
    """Pending application for shopkeepers who want admin access."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    application_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100, blank=False, null=False)
    last_name = models.CharField(max_length=100, blank=False, null=False)
    email = models.EmailField(null=False, blank=False)
    phone = models.CharField(
        max_length=10,
        validators=[RegexValidator(r'^[6-9]\d{9}$', 'Invalid phone number')],
        null=False,
        blank=False,
    )
    shop_name = models.CharField(max_length=200, null=False, blank=False)
    shop_address = models.TextField(null=True, blank=True)
    gst_number = models.CharField(max_length=30, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey('Admin', on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_applications')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    decision_note = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'admin_signup_application'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"AdminSignupApplication({self.application_id}) {self.email} [{self.status}]"


# ======================== CATEGORY MODEL ========================
class Category(models.Model):
    """Product category model"""
    category_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True, null=False, blank=False)
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    owner_admin = models.ForeignKey('Admin', on_delete=models.SET_NULL, null=True, blank=True, related_name='categories')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'category'
        ordering = ['name']
    
    def __str__(self):
        return self.name


# ======================== SUBSCRIPTION MODEL ========================
class Subscription(models.Model):
    """Subscription plans model"""
    BILLING_CYCLE_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    subscription_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True, null=False, blank=False)
    description = models.TextField(null=True, blank=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=False,
        blank=False
    )
    billing_cycle = models.CharField(max_length=20, choices=BILLING_CYCLE_CHOICES, default='monthly')
    duration_days = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(365)],
        null=False,
        blank=False
    )
    product_discount_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=1.00,
    )
    includes_delivery_scheduling = models.BooleanField(default=True)
    suppress_daily_payments = models.BooleanField(default=True)
    max_products = models.IntegerField(validators=[MinValueValidator(1)], null=False, blank=False)
    features = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    owner_admin = models.ForeignKey('Admin', on_delete=models.SET_NULL, null=True, blank=True, related_name='subscriptions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscription'
        ordering = ['price']
    
    def __str__(self):
        return f"{self.name} - ${self.price}"


# ======================== CUSTOMER MODEL ========================
class Customer(models.Model):
    """Customer model with subscription reference"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
    ]
    
    customer_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100, null=False, blank=False)
    last_name = models.CharField(max_length=100, null=False, blank=False)
    email = models.EmailField(unique=True, null=False, blank=False)
    username = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        validators=[RegexValidator(r'^[a-zA-Z0-9_]{3,50}$', 'Invalid username')],
    )
    password = models.CharField(max_length=255, null=False, blank=True, default='')
    phone = models.CharField(
        max_length=15,
        validators=[RegexValidator(r'^[6-9]\d{9}$', 'Invalid phone number')],
        null=False,
        blank=False
    )
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=50, null=True, blank=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customers'
    )
    subscription_start_date = models.DateTimeField(null=True, blank=True)
    subscription_end_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_verified = models.BooleanField(default=False)
    owner_admin = models.ForeignKey('Admin', on_delete=models.SET_NULL, null=True, blank=True, related_name='customers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'customer'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    def set_password(self, raw_password):
        """Hash and set the password"""
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Check if raw password matches hashed password"""
        from django.contrib.auth.hashers import check_password as django_check_password
        if not self.password:
            return False
        try:
            return django_check_password(raw_password, self.password)
        except Exception:
            return False


# ======================== CUSTOMER ADDRESS MODEL ========================
class CustomerAddress(models.Model):
    """Address book for customers (supports multiple saved addresses)."""
    DELIVERY_SLOT_CHOICES = [
        ('morning', 'Morning'),
        ('evening', 'Evening'),
    ]

    address_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='addresses')
    label = models.CharField(max_length=50, null=True, blank=True)
    line1 = models.CharField(max_length=255, null=False, blank=False)
    line2 = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=50, null=True, blank=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    delivery_slot = models.CharField(max_length=20, choices=DELIVERY_SLOT_CHOICES, default='morning')
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customer_address'
        ordering = ['-is_default', '-updated_at', '-created_at']
        indexes = [
            models.Index(fields=['customer', 'is_default'], name='customer_ad_custome_b6dca3_idx'),
        ]

    def __str__(self):
        name = self.label or "Address"
        return f"{name} ({self.customer_id})"


# ======================== USER NOTIFICATION MODEL ========================
class UserNotification(models.Model):
    TYPE_CHOICES = [
        ('system', 'System'),
        ('warning', 'Warning'),
        ('payment', 'Payment'),
        ('order', 'Order'),
    ]

    notification_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='notifications')
    product = models.ForeignKey('Product', on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='system')
    title = models.CharField(max_length=160)
    message = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_notification'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'created_at']),
            models.Index(fields=['customer', 'is_read']),
        ]

    def __str__(self):
        return f"{self.customer_id}: {self.title}"


# ======================== PRODUCT MODEL ========================
class Product(models.Model):
    """Product model with category reference"""
    PRODUCT_STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('discontinued', 'Discontinued'),
    ]
    
    product_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200, null=False, blank=False)
    description = models.TextField(null=True, blank=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='products',
        null=False
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=False,
        blank=False
    )
    cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True
    )
    quantity_in_stock = models.IntegerField(
        validators=[MinValueValidator(0)],
        default=0,
        null=False,
        blank=False
    )
    sku = models.CharField(max_length=50, unique=True, null=False, blank=False)
    status = models.CharField(max_length=20, choices=PRODUCT_STATUS_CHOICES, default='active')
    is_featured = models.BooleanField(default=False)
    subscription_only = models.BooleanField(default=False)
    rating = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    tags = models.JSONField(default=list, blank=True)
    created_by = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True, related_name='products')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'product'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', 'status']),
            models.Index(fields=['sku']),
        ]
    
    def __str__(self):
        return f"{self.name} (SKU: {self.sku})"


# ======================== SUBSCRIPTION DELIVERY BASKET ========================
class SubscriptionBasketItem(models.Model):
    """Recurring delivery item attached to the customer's active subscription period."""
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('alternate', 'Alternate Days'),
        ('weekly', 'Weekly'),
    ]

    basket_item_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='subscription_basket')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='subscription_basket_items')
    quantity = models.IntegerField(validators=[MinValueValidator(1)], default=1)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subscription_basket_item'
        ordering = ['-updated_at']
        unique_together = ('customer', 'product', 'is_active')

    def __str__(self):
        return f"{self.customer_id} - {self.product_id} ({self.frequency})"


# ======================== SUBSCRIPTION DELIVERY MODELS ========================
class SubscriptionDelivery(models.Model):
    """Persisted delivery record for subscription basket items."""
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('packed', 'Packed'),
        ('out_for_delivery', 'Out For Delivery'),
        ('delivered', 'Delivered'),
        ('missed', 'Missed'),
        ('skipped', 'Skipped'),
    ]
    DELIVERY_SLOT_CHOICES = CustomerAddress.DELIVERY_SLOT_CHOICES

    delivery_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='subscription_deliveries')
    subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True, related_name='deliveries')
    delivery_address = models.ForeignKey(CustomerAddress, on_delete=models.SET_NULL, null=True, blank=True, related_name='subscription_deliveries')
    delivery_slot = models.CharField(max_length=20, choices=DELIVERY_SLOT_CHOICES, default='morning')
    scheduled_for = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    delivered_at = models.DateTimeField(null=True, blank=True)
    notes = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subscription_delivery'
        ordering = ['-scheduled_for']
        unique_together = ('customer', 'scheduled_for')
        indexes = [
            models.Index(fields=['customer', 'scheduled_for']),
            models.Index(fields=['scheduled_for', 'status']),
        ]

    def __str__(self):
        return f"Delivery {self.delivery_id} {self.customer_id} {self.scheduled_for}"


class SubscriptionDeliveryItem(models.Model):
    """Snapshot items for a specific subscription delivery day."""
    delivery_item_id = models.AutoField(primary_key=True)
    delivery = models.ForeignKey(SubscriptionDelivery, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='subscription_delivery_items')
    product_name = models.CharField(max_length=200)
    quantity = models.IntegerField(validators=[MinValueValidator(1)], default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'subscription_delivery_item'
        ordering = ['delivery_item_id']
        unique_together = ('delivery', 'product')

    def __str__(self):
        return f"{self.delivery_id} - {self.product_name}"

# ======================== PAYMENT TRANSACTION MODEL ========================
class PaymentTransaction(models.Model):
    """Payment records for user subscription purchases"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]
    METHOD_CHOICES = [
        ('card', 'Card'),
        ('upi', 'UPI'),
        ('netbanking', 'Net Banking'),
    ]

    payment_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='payments')
    subscription = models.ForeignKey(Subscription, on_delete=models.PROTECT, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='card')
    transaction_reference = models.CharField(max_length=50, unique=True, default='', blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payment_transaction'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['transaction_reference']),
        ]

    def save(self, *args, **kwargs):
        if not self.transaction_reference:
            self.transaction_reference = f"TXN-{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)


# ======================== ORDER MODELS ========================
class Order(models.Model):
    """Customer product orders created from cart checkout"""
    STATUS_CHOICES = [
        ('placed', 'Placed'),
        ('confirmed', 'Confirmed'),
        ('packed', 'Packed'),
        ('out_for_delivery', 'Out For Delivery'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    ]
    DELIVERY_SLOT_CHOICES = CustomerAddress.DELIVERY_SLOT_CHOICES

    order_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    delivery_address = models.ForeignKey(CustomerAddress, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    delivery_date = models.DateField(default=timezone.localdate)
    delivery_slot = models.CharField(max_length=20, choices=DELIVERY_SLOT_CHOICES, default='morning')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='placed')
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'order'
        ordering = ['-created_at']


class OrderItem(models.Model):
    """Line item for an order"""
    order_item_id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='order_items')
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    line_total = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])

    class Meta:
        db_table = 'order_item'


class OrderPayment(models.Model):
    """Payment transaction for product order checkout"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]
    METHOD_CHOICES = [
        ('card', 'Card'),
        ('upi', 'UPI'),
        ('netbanking', 'Net Banking'),
        ('cod', 'Cash On Delivery'),
    ]

    order_payment_id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='card')
    transaction_reference = models.CharField(max_length=50, unique=True, default='', blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'order_payment'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.transaction_reference:
            self.transaction_reference = f"ORDPAY-{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)
