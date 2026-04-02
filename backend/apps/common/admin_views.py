from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render
from django.db.models import Sum, Count
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView
from apps.accounts.models import Tenant, User
from apps.billing.models import TenantSubscription, Plan
from apps.products.models import Product
from apps.orders.models import Order
from datetime import timedelta
from django.utils import timezone

@method_decorator(staff_member_required, name='dispatch')
class AdminMetricsView(TemplateView):
    template_name = 'admin/metrics.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # 1. Signups (Last 30 days)
        last_30_days = timezone.now() - timedelta(days=30)
        context['total_tenants'] = Tenant.objects.count()
        context['new_tenants_30d'] = Tenant.objects.filter(created_at__gte=last_30_days).count()
        
        # 2. MRR Calculation
        # Sum of price_monthly_inr for all active/trialing subscriptions
        active_subs = TenantSubscription.objects.filter(status__in=['active', 'trialing']).select_related('plan')
        mrr = active_subs.aggregate(total=Sum('plan__price_monthly_inr'))['total'] or 0
        context['mrr_inr'] = mrr
        
        # 3. System Stats
        context['total_products'] = Product.objects.count()
        context['total_orders'] = Order.objects.count()
        
        # 4. Plan Distribution
        context['plan_stats'] = TenantSubscription.objects.values('plan__display_name').annotate(count=Count('id')).order_by('-count')
        
        # 5. Recent Tenatns
        context['recent_tenants'] = Tenant.objects.all().order_by('-created_at')[:10]

        return context
