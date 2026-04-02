import stripe
from django.conf import settings
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import TenantSubscription, Plan
from .limits import check_sku_limit, check_channel_limit

stripe.api_key = settings.STRIPE_SECRET_KEY

class SubscriptionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        sub = getattr(tenant, "subscription", None)
        
        if not sub or not sub.plan:
            return Response({"error": "No subscription found"}, status=status.HTTP_404_NOT_FOUND)
            
        sku_allowed, sku_current, sku_limit = check_sku_limit(tenant)
        channel_allowed, channel_current, channel_limit = check_channel_limit(tenant)
        
        # Determine users and locations limits (mocked current count for now)
        from apps.accounts.models import User
        from apps.inventory.models import Location
        users_current = User.objects.filter(tenant=tenant).count()
        locations_current = Location.objects.filter(tenant=tenant).count()

        return Response({
            "plan": sub.plan.name,
            "display_name": sub.plan.display_name,
            "status": sub.status,
            "trial_ends_at": sub.trial_ends_at,
            "current_period_end": sub.current_period_end,
            "usage": {
                "skus": {"current": sku_current, "limit": sku_limit},
                "channels": {"current": channel_current, "limit": channel_limit},
                "locations": {"current": locations_current, "limit": sub.plan.max_locations},
                "users": {"current": users_current, "limit": sub.plan.max_users}
            },
            "stripe_customer_id": sub.stripe_customer_id,
            "features": {
                "has_forecasting": sub.plan.has_forecasting,
                "has_gst_reports": sub.plan.has_gst_reports,
                "has_whatsapp_alerts": sub.plan.has_whatsapp_alerts,
                "has_bundles": sub.plan.has_bundles,
                "has_api_access": sub.plan.has_api_access
            }
        })


class CreateCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "checkout"

    def post(self, request):
        plan_name = request.data.get("plan")
        currency = request.data.get("currency", "inr").lower()
        
        try:
            plan = Plan.objects.get(name=plan_name)
        except Plan.DoesNotExist:
            return Response({"error": "Plan not found"}, status=status.HTTP_400_BAD_REQUEST)
            
        price_id = plan.stripe_price_id_inr if currency == "inr" else plan.stripe_price_id_usd
        if not price_id:
            return Response({"error": "Stripe price not configured for this plan/currency"}, status=status.HTTP_400_BAD_REQUEST)
            
        tenant = request.user.tenant
        sub = getattr(tenant, "subscription", None)
        
        customer_id = sub.stripe_customer_id if sub else None
        
        # Create a new checkout session
        try:
            session_kwargs = {
                "payment_method_types": ["card"],
                "line_items": [{"price": price_id, "quantity": 1}],
                "mode": "subscription",
                "success_url": f"{settings.FRONTEND_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
                "cancel_url": f"{settings.FRONTEND_URL}/billing/upgrade",
                "client_reference_id": str(tenant.id),
            }
            if customer_id:
                session_kwargs["customer"] = customer_id
            else:
                session_kwargs["customer_email"] = request.user.email
                
            checkout_session = stripe.checkout.Session.create(**session_kwargs)
            
            return Response({"checkout_url": checkout_session.url})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreatePortalSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tenant = request.user.tenant
        sub = getattr(tenant, "subscription", None)
        
        if not sub or not sub.stripe_customer_id:
            return Response({"error": "No Stripe customer found. Please subscribe first."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Create a portal session
            portal_session = stripe.billing_portal.Session.create(
                customer=sub.stripe_customer_id,
                return_url=f"{settings.FRONTEND_URL}/settings/billing",
            )
            return Response({"portal_url": portal_session.url})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# DJStripe Webhook Handlers
try:
    from djstripe import webhooks
    
    @webhooks.handler("customer.subscription.updated")
    def my_handler_update(event, **kwargs):
        subscription = event.data["object"]
        djstripe_sub = event.djstripe_obj
        
        customer_id = subscription.get("customer")
        
        # Find TenantSubscription by customer_id
        TenantSubscription.objects.filter(stripe_customer_id=customer_id).update(
            status="active" if subscription.get("status") in ["active", "trialing"] else "past_due",
            current_period_end=djstripe_sub.current_period_end if hasattr(djstripe_sub, 'current_period_end') else None,
            stripe_subscription_id=subscription.get("id"),
        )

    @webhooks.handler("customer.subscription.deleted")
    def my_handler_delete(event, **kwargs):
        subscription = event.data["object"]
        customer_id = subscription.get("customer")
        
        # Downgrade to Starter
        starter_plan = Plan.objects.filter(name="starter").first()
        TenantSubscription.objects.filter(stripe_customer_id=customer_id).update(
            status="cancelled",
            plan=starter_plan
        )
except ImportError:
    pass
