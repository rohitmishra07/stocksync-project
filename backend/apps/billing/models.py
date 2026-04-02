from django.db import models

class Plan(models.Model):
    PLAN_CHOICES = [
        ('starter', 'Starter'),
        ('growth', 'Growth'),
        ('pro', 'Pro'),
    ]
    name = models.CharField(max_length=20, choices=PLAN_CHOICES, unique=True)
    display_name = models.CharField(max_length=50)
    price_monthly_inr = models.DecimalField(max_digits=8, decimal_places=2)
    price_monthly_usd = models.DecimalField(max_digits=8, decimal_places=2)
    stripe_price_id_inr = models.CharField(max_length=100, blank=True)
    stripe_price_id_usd = models.CharField(max_length=100, blank=True)

    # Limits
    max_skus = models.IntegerField()         # -1 = unlimited
    max_channels = models.IntegerField()     # number of sales channels
    max_locations = models.IntegerField()    # warehouses/stores
    max_users = models.IntegerField()        # team members
    has_forecasting = models.BooleanField(default=False)
    has_gst_reports = models.BooleanField(default=False)
    has_whatsapp_alerts = models.BooleanField(default=False)
    has_bundles = models.BooleanField(default=False)
    has_api_access = models.BooleanField(default=False)

    def __str__(self):
        return self.display_name


class TenantSubscription(models.Model):
    STATUS_CHOICES = [
        ('trialing', 'Trialing'),
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('cancelled', 'Cancelled'),
        ('free', 'Free'),
    ]
    tenant = models.OneToOneField(
        'accounts.Tenant', on_delete=models.CASCADE,
        related_name='subscription'
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, null=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='trialing'
    )
    stripe_customer_id = models.CharField(max_length=100, blank=True)
    stripe_subscription_id = models.CharField(max_length=100, blank=True)
    trial_ends_at = models.DateTimeField(null=True)
    current_period_end = models.DateTimeField(null=True)
    cancelled_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_active(self):
        return self.status in ['trialing', 'active']

    def __str__(self):
        return f"{self.tenant.name} — {self.plan}"
