from django.core.management.base import BaseCommand
from django.utils import timezone
import secrets

from api.models import Admin, AdminSecurityProfile


class Command(BaseCommand):
    help = "Create (or promote) a super_admin for local developer access."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True, help="Email for the super admin")
        parser.add_argument("--phone", required=True, help="Phone (digits or +countrycode)")
        parser.add_argument("--first-name", default="Developer", help="First name")
        parser.add_argument("--last-name", default="Admin", help="Last name")
        parser.add_argument("--username", default="", help="Username (optional)")
        parser.add_argument("--password", default="", help="Password (optional; auto-generated if omitted)")
        parser.add_argument(
            "--promote",
            action="store_true",
            help="If an admin with this email exists, promote it to super_admin",
        )

    def handle(self, *args, **options):
        email = (options["email"] or "").strip()
        phone = (options["phone"] or "").strip()
        first_name = (options["first_name"] or "").strip()
        last_name = (options["last_name"] or "").strip()
        username = (options["username"] or "").strip()
        password = (options["password"] or "").strip()
        promote = bool(options["promote"])

        existing_super = Admin.objects.filter(role="super_admin").first()
        if existing_super and not promote:
            self.stdout.write(self.style.WARNING("A super_admin already exists. Use --promote to promote an existing admin."))
            self.stdout.write(f"Existing super_admin: admin_id={existing_super.admin_id}, email={existing_super.email}, username={existing_super.username}")
            return

        if not password:
            # 16+ chars, URL-safe; user should change after first login.
            password = secrets.token_urlsafe(12)

        if not username:
            # Keep it deterministic-ish and unique.
            username = f"mm_dev_{secrets.token_hex(3)}"

        existing_by_email = Admin.objects.filter(email__iexact=email).first()
        if existing_by_email:
            if not promote:
                raise SystemExit("Admin with this email already exists. Re-run with --promote to promote it.")

            existing_by_email.first_name = first_name or existing_by_email.first_name
            existing_by_email.last_name = last_name or existing_by_email.last_name
            existing_by_email.phone = phone or existing_by_email.phone
            if username and username.lower() != (existing_by_email.username or "").lower():
                if Admin.objects.filter(username__iexact=username).exclude(admin_id=existing_by_email.admin_id).exists():
                    raise SystemExit("Username already in use. Choose a different --username.")
                existing_by_email.username = username
            existing_by_email.role = "super_admin"
            existing_by_email.is_active = True
            existing_by_email.set_password(password)
            existing_by_email.updated_at = timezone.now()
            existing_by_email.save()
            AdminSecurityProfile.objects.update_or_create(
                admin=existing_by_email,
                defaults={
                    "must_change_password": False,
                    "last_password_change_at": timezone.now(),
                    "failed_login_attempts": 0,
                    "locked_until": None,
                },
            )

            self.stdout.write(self.style.SUCCESS("Promoted admin to super_admin."))
            self.stdout.write(f"Login ID (username): {existing_by_email.username}")
            self.stdout.write(f"Password: {password}")
            return

        if Admin.objects.filter(username__iexact=username).exists():
            raise SystemExit("Username already in use. Choose a different --username.")

        admin = Admin(
            first_name=first_name or "Developer",
            last_name=last_name or "Admin",
            email=email,
            phone=phone,
            username=username,
            role="super_admin",
            is_active=True,
        )
        admin.set_password(password)
        admin.save()
        AdminSecurityProfile.objects.update_or_create(
            admin=admin,
            defaults={
                "must_change_password": False,
                "last_password_change_at": timezone.now(),
                "failed_login_attempts": 0,
                "locked_until": None,
            },
        )

        self.stdout.write(self.style.SUCCESS("Created super_admin."))
        self.stdout.write(f"Login ID (username): {admin.username}")
        self.stdout.write(f"Password: {password}")
