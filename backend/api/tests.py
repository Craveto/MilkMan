from unittest.mock import patch

from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import Admin, AdminSecurityProfile, AdminSignupApplication


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    DEFAULT_FROM_EMAIL='no-reply@test.local',
    DEVELOPER_ALLOWED_IPS=['127.0.0.1'],
    DEVELOPER_EMAILS=['owner@test.local'],
)
class DeveloperAdminApplicationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.super_admin = Admin.objects.create(
            first_name='Super',
            last_name='Admin',
            email='super@test.local',
            phone='9876543210',
            username='superadmin',
            role='super_admin',
            is_active=True,
        )
        self.super_admin.set_password('Secret123!')
        self.super_admin.save(update_fields=['password'])

        session = self.client.session
        session['auth_role'] = 'admin'
        session['auth_user_id'] = self.super_admin.admin_id
        session.save()

    def _create_application(self, email='applicant@test.local'):
        return AdminSignupApplication.objects.create(
            first_name='Prajwal',
            last_name='Dighore',
            email=email,
            phone='8010202390',
            shop_name='theCake',
            shop_address='Pune',
            gst_number='gylpd7298b',
            notes='Leader cake baker in Pune',
        )

    def test_approve_application_creates_admin_and_sends_credentials_email(self):
        application = self._create_application()

        response = self.client.post(
            f'/api/developer/admin-applications/{application.application_id}/approve/',
            {'note': 'Approved for launch'},
            format='json',
            REMOTE_ADDR='127.0.0.1',
        )

        self.assertEqual(response.status_code, 200)
        application.refresh_from_db()

        self.assertEqual(application.status, 'approved')
        self.assertEqual(application.reviewed_by_id, self.super_admin.admin_id)
        self.assertEqual(application.decision_note, 'Approved for launch')

        created_admin = Admin.objects.get(email='applicant@test.local')
        self.assertEqual(created_admin.role, 'admin')
        self.assertEqual(created_admin.username, response.data['username'])
        self.assertEqual(response.data['admin_id'], created_admin.admin_id)

        self.assertEqual(len(mail.outbox), 2)
        applicant_email = mail.outbox[0]
        self.assertEqual(applicant_email.to, ['applicant@test.local'])
        self.assertIn('approved', applicant_email.subject.lower())
        self.assertIn(created_admin.username, applicant_email.body)
        self.assertIn('Temporary password:', applicant_email.body)

        profile = AdminSecurityProfile.objects.get(admin=created_admin)
        self.assertTrue(profile.must_change_password)
        self.assertIsNotNone(profile.last_password_change_at)

    def test_approve_rolls_back_when_applicant_email_fails(self):
        application = self._create_application(email='broken@test.local')

        with patch('api.views.send_mail', side_effect=RuntimeError('smtp down')):
            response = self.client.post(
                f'/api/developer/admin-applications/{application.application_id}/approve/',
                {'note': 'Approved'},
                format='json',
                REMOTE_ADDR='127.0.0.1',
            )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.data['error'], 'Approval email could not be sent. No changes were saved.')

        application.refresh_from_db()
        self.assertEqual(application.status, 'pending')
        self.assertFalse(Admin.objects.filter(email='broken@test.local').exists())

    def test_reject_application_sends_email_and_persists_status(self):
        application = self._create_application(email='reject@test.local')

        response = self.client.post(
            f'/api/developer/admin-applications/{application.application_id}/reject/',
            {'note': 'GST mismatch'},
            format='json',
            REMOTE_ADDR='127.0.0.1',
        )

        self.assertEqual(response.status_code, 200)
        application.refresh_from_db()

        self.assertEqual(application.status, 'rejected')
        self.assertEqual(application.decision_note, 'GST mismatch')
        self.assertEqual(len(mail.outbox), 2)
        self.assertIn('rejected', mail.outbox[0].subject.lower())
        self.assertIn('GST mismatch', mail.outbox[0].body)


@override_settings(
    DEVELOPER_ALLOWED_IPS=['203.0.113.10'],
    DEVELOPER_TRUST_X_FORWARDED_FOR=True,
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
)
class DeveloperAccessProxyTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.super_admin = Admin.objects.create(
            first_name='Proxy',
            last_name='Admin',
            email='proxy@test.local',
            phone='9876543211',
            username='proxyadmin',
            role='super_admin',
            is_active=True,
        )
        self.super_admin.set_password('Secret123!')
        self.super_admin.save(update_fields=['password'])

        session = self.client.session
        session['auth_role'] = 'admin'
        session['auth_user_id'] = self.super_admin.admin_id
        session.save()

    def test_forwarded_for_is_used_when_enabled(self):
        response = self.client.get(
            '/api/developer/admin-applications/',
            HTTP_X_FORWARDED_FOR='203.0.113.10, 10.0.0.1',
            REMOTE_ADDR='10.0.0.1',
        )

        self.assertEqual(response.status_code, 200)


@override_settings(
    DEVELOPER_ALLOWED_IPS=['127.0.0.1'],
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    ADMIN_MAX_FAILED_LOGIN_ATTEMPTS=2,
    ADMIN_LOCKOUT_MINUTES=30,
)
class AdminSecurityProfileTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = Admin.objects.create(
            first_name='Regular',
            last_name='Admin',
            email='admin@test.local',
            phone='9876543212',
            username='regularadmin',
            role='admin',
            is_active=True,
        )
        self.admin.set_password('Secret123!')
        self.admin.save(update_fields=['password'])
        AdminSecurityProfile.objects.update_or_create(
            admin=self.admin,
            defaults={
                'must_change_password': True,
            },
        )

    def test_admin_login_returns_must_change_password_flag(self):
        response = self.client.post(
            '/api/auth/login/',
            {'identifier': 'regularadmin', 'password': 'Secret123!'},
            format='json',
            REMOTE_ADDR='127.0.0.1',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['user']['must_change_password'])

        profile = AdminSecurityProfile.objects.get(admin=self.admin)
        self.assertEqual(profile.failed_login_attempts, 0)
        self.assertIsNone(profile.locked_until)

    def test_admin_is_locked_after_repeated_failed_logins(self):
        for _ in range(2):
            response = self.client.post(
                '/api/auth/login/',
                {'identifier': 'regularadmin', 'password': 'wrong-pass'},
                format='json',
                REMOTE_ADDR='127.0.0.1',
            )

        self.assertEqual(response.status_code, 401)

        locked_response = self.client.post(
            '/api/auth/login/',
            {'identifier': 'regularadmin', 'password': 'Secret123!'},
            format='json',
            REMOTE_ADDR='127.0.0.1',
        )
        self.assertEqual(locked_response.status_code, 423)

        profile = AdminSecurityProfile.objects.get(admin=self.admin)
        self.assertEqual(profile.failed_login_attempts, 2)
        self.assertIsNotNone(profile.locked_until)

    def test_admin_can_change_password_and_clear_must_change_flag(self):
        session = self.client.session
        session['auth_role'] = 'admin'
        session['auth_user_id'] = self.admin.admin_id
        session.save()

        response = self.client.post(
            '/api/auth/admin/change-password/',
            {'current_password': 'Secret123!', 'new_password': 'NewSecret123!'},
            format='json',
            REMOTE_ADDR='127.0.0.1',
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['user']['must_change_password'])

        self.admin.refresh_from_db()
        self.assertTrue(self.admin.check_password('NewSecret123!'))

        profile = AdminSecurityProfile.objects.get(admin=self.admin)
        self.assertFalse(profile.must_change_password)
        self.assertIsNotNone(profile.last_password_change_at)
        self.assertEqual(profile.failed_login_attempts, 0)
        self.assertIsNone(profile.locked_until)
