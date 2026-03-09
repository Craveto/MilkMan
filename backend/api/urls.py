from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'admins', views.AdminViewSet, basename='admin')
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'subscriptions', views.SubscriptionViewSet, basename='subscription')
router.register(r'customers', views.CustomerViewSet, basename='customer')
router.register(r'products', views.ProductViewSet, basename='product')
router.register(r'deliveries', views.SubscriptionDeliveryViewSet, basename='delivery')
router.register(r'admin-orders', views.AdminOrderViewSet, basename='admin-order')

urlpatterns = [
    path('', include(router.urls)),
    path('hello/', views.hello_world, name='hello-world'),
    path('auth/signup/', views.auth_signup, name='auth-signup'),
    path('auth/login/', views.auth_login, name='auth-login'),
    path('developer/auth/login/', views.developer_auth_login, name='developer-auth-login'),
    path('auth/me/', views.auth_me, name='auth-me'),
    path('auth/logout/', views.auth_logout, name='auth-logout'),
    path('user/dashboard-data/', views.user_dashboard_data, name='user-dashboard-data'),
    path('user/subscribe/', views.user_subscribe, name='user-subscribe'),
    path('user/subscription-basket/', views.user_subscription_basket, name='user-subscription-basket'),
    path('user/subscription-deliveries/', views.user_subscription_deliveries, name='user-subscription-deliveries'),
    path('user/payments/', views.user_payments, name='user-payments'),
    path('user/notifications/', views.user_notifications, name='user-notifications'),
    path('user/deactivate-subscription/', views.user_deactivate_subscription, name='user-deactivate-subscription'),
    path('user/cart-checkout/', views.user_cart_checkout, name='user-cart-checkout'),
    path('user/orders/', views.user_orders, name='user-orders'),
    path('user/profile/', views.user_profile, name='user-profile'),
    path('user/addresses/', views.user_addresses, name='user-addresses'),
    path('user/addresses/<int:address_id>/', views.user_address_detail, name='user-address-detail'),
    path('user/otp/request/', views.user_otp_request, name='user-otp-request'),
    path('user/otp/verify/', views.user_otp_verify, name='user-otp-verify'),
    path('developer/admin-applications/', views.developer_admin_applications, name='developer-admin-applications'),
    path('developer/admin-applications/<int:application_id>/approve/', views.developer_admin_application_approve, name='developer-admin-application-approve'),
    path('developer/admin-applications/<int:application_id>/reject/', views.developer_admin_application_reject, name='developer-admin-application-reject'),
]
