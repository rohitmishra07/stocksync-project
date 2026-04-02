from django.urls import path
from . import views

urlpatterns = [
    path("subscription/", views.SubscriptionDetailView.as_view(), name="subscription-detail"),
    path("create-checkout-session/", views.CreateCheckoutSessionView.as_view(), name="create-checkout-session"),
    path("create-portal-session/", views.CreatePortalSessionView.as_view(), name="create-portal-session"),
]
