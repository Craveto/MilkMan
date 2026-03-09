from django.contrib import admin

from .models import Admin, AdminSecurityProfile, AdminSignupApplication


@admin.register(Admin)
class AdminAdmin(admin.ModelAdmin):
    list_display = ('admin_id', 'username', 'email', 'role', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')


@admin.register(AdminSecurityProfile)
class AdminSecurityProfileAdmin(admin.ModelAdmin):
    list_display = ('admin', 'must_change_password', 'failed_login_attempts', 'locked_until', 'last_password_change_at')
    search_fields = ('admin__username', 'admin__email')


@admin.register(AdminSignupApplication)
class AdminSignupApplicationAdmin(admin.ModelAdmin):
    list_display = ('application_id', 'email', 'shop_name', 'status', 'reviewed_at')
    search_fields = ('email', 'shop_name', 'first_name', 'last_name')
