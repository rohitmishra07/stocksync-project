"""Order business logic."""

from django.db import transaction
from django.utils import timezone

from apps.inventory.services import adjust_stock, release_reservation, InsufficientStockError


@transaction.atomic
def fulfill_order(order, location, user):
    """Fulfill an order — deduct stock and update status."""
    if order.status not in ("pending", "confirmed", "processing"):
        raise ValueError(f"Cannot fulfill order in status: {order.status}")

    from apps.products.models import Bundle

    for item in order.items.all():
        bundle = Bundle.objects.filter(tenant=order.tenant, sku=item.sku, is_active=True).first()
        if bundle:
            for comp in bundle.components.all():
                variant = comp.product.variants.first()
                if variant:
                    adjust_stock(
                        variant=variant,
                        location=location,
                        quantity_change=-(item.quantity * comp.quantity),
                        user=user,
                        notes=f"Order {order.order_number} fulfillment (Bundle Component: {bundle.sku})",
                        reference_type="order",
                        reference_id=str(order.id),
                    )
        elif item.variant:
            adjust_stock(
                variant=item.variant,
                location=location,
                quantity_change=-item.quantity,
                user=user,
                notes=f"Order {order.order_number} fulfillment",
                reference_type="order",
                reference_id=str(order.id),
            )

    order.status = "shipped"
    order.shipped_at = timezone.now()
    order.fulfilled_from = location
    order.save(update_fields=["status", "shipped_at", "fulfilled_from", "updated_at"])
    return order


@transaction.atomic
def cancel_order(order, location, user):
    """Cancel an order — restore stock if already deducted."""
    if order.status in ("delivered", "cancelled"):
        raise ValueError(f"Cannot cancel order in status: {order.status}")

    from apps.products.models import Bundle
    # If shipped, restore stock
    if order.status == "shipped" and order.fulfilled_from:
        for item in order.items.all():
            bundle = Bundle.objects.filter(tenant=order.tenant, sku=item.sku, is_active=True).first()
            if bundle:
                for comp in bundle.components.all():
                    variant = comp.product.variants.first()
                    if variant:
                        adjust_stock(
                            variant=variant,
                            location=order.fulfilled_from,
                            quantity_change=(item.quantity * comp.quantity),
                            user=user,
                            notes=f"Order {order.order_number} cancellation (Bundle Component: {bundle.sku})",
                            reference_type="order",
                            reference_id=str(order.id),
                        )
            elif item.variant:
                adjust_stock(
                    variant=item.variant,
                    location=order.fulfilled_from,
                    quantity_change=item.quantity,
                    user=user,
                    notes=f"Order {order.order_number} cancellation — stock restored",
                    reference_type="order",
                    reference_id=str(order.id),
                )

    order.status = "cancelled"
    order.save(update_fields=["status", "updated_at"])
    return order
