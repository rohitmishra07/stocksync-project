"""Inventory business logic — stock adjustments, transfers."""

from django.db import transaction
from django.db.models import F

from .models import Location, StockLevel, StockMovement


class InsufficientStockError(Exception):
    pass


@transaction.atomic
def adjust_stock(variant, location, quantity_change, user, notes="", reference_type="manual", reference_id=""):
    """
    Adjust stock for a variant at a location.
    Positive = add stock, Negative = remove stock.
    """
    stock, created = StockLevel.objects.select_for_update().get_or_create(
        variant=variant,
        location=location,
        defaults={"quantity": 0},
    )

    new_quantity = stock.quantity + quantity_change
    if new_quantity < 0:
        raise InsufficientStockError(
            f"Cannot reduce stock below 0. Current: {stock.quantity}, Change: {quantity_change}"
        )

    stock.quantity = new_quantity
    stock.save(update_fields=["quantity", "updated_at"])

    movement_type = "adjustment"
    if reference_type == "purchase_order":
        movement_type = "purchase_in"
    elif reference_type == "order":
        movement_type = "sale_out"

    StockMovement.objects.create(
        tenant=variant.tenant,
        variant=variant,
        location=location,
        movement_type=movement_type,
        quantity_change=quantity_change,
        quantity_before=new_quantity - quantity_change,
        quantity_after=new_quantity,
        reference_type=reference_type,
        reference_id=str(reference_id),
        notes=notes,
        created_by=user,
    )

    return stock


@transaction.atomic
def transfer_stock(variant, from_location, to_location, quantity, user, notes=""):
    """Transfer stock between two locations."""
    if quantity <= 0:
        raise ValueError("Transfer quantity must be positive")

    # Deduct from source
    source_stock = StockLevel.objects.select_for_update().get(
        variant=variant, location=from_location
    )
    if source_stock.quantity < quantity:
        raise InsufficientStockError(
            f"Insufficient stock at {from_location.name}. "
            f"Available: {source_stock.quantity}, Requested: {quantity}"
        )

    source_stock.quantity -= quantity
    source_stock.save(update_fields=["quantity", "updated_at"])

    # Add to destination
    dest_stock, _ = StockLevel.objects.select_for_update().get_or_create(
        variant=variant,
        location=to_location,
        defaults={"quantity": 0},
    )
    dest_stock.quantity += quantity
    dest_stock.save(update_fields=["quantity", "updated_at"])

    # Record movements
    transfer_ref = f"transfer-{variant.sku}-{from_location.id}-{to_location.id}"

    StockMovement.objects.bulk_create([
        StockMovement(
            tenant=variant.tenant,
            variant=variant,
            location=from_location,
            movement_type="transfer_out",
            quantity_change=-quantity,
            quantity_before=source_stock.quantity + quantity,
            quantity_after=source_stock.quantity,
            reference_type="transfer",
            reference_id=transfer_ref,
            notes=notes,
            created_by=user,
        ),
        StockMovement(
            tenant=variant.tenant,
            variant=variant,
            location=to_location,
            movement_type="transfer_in",
            quantity_change=quantity,
            quantity_before=dest_stock.quantity - quantity,
            quantity_after=dest_stock.quantity,
            reference_type="transfer",
            reference_id=transfer_ref,
            notes=notes,
            created_by=user,
        ),
    ])
    return source_stock, dest_stock


@transaction.atomic
def reserve_stock(variant, location, quantity):
    """Reserve stock for an order (doesn't deduct, just reserves)."""
    stock = StockLevel.objects.select_for_update().get(variant=variant, location=location)
    if stock.available_quantity < quantity:
        raise InsufficientStockError(
            f"Insufficient available stock. Available: {stock.available_quantity}"
        )
    stock.reserved_quantity = F("reserved_quantity") + quantity
    stock.save(update_fields=["reserved_quantity", "updated_at"])


@transaction.atomic
def release_reservation(variant, location, quantity):
    """Release reserved stock (e.g., order cancelled)."""
    stock = StockLevel.objects.select_for_update().get(variant=variant, location=location)
    stock.reserved_quantity = F("reserved_quantity") - quantity
    stock.save(update_fields=["reserved_quantity", "updated_at"])


def get_inventory_valuation(tenant):
    """Calculate the total cost and retail value of current inventory."""
    from decimal import Decimal
    from django.db.models import F, Sum, DecimalField, ExpressionWrapper
    from django.db.models.functions import Coalesce
    from apps.inventory.models import StockLevel

    qs = StockLevel.objects.filter(location__tenant=tenant, quantity__gt=0)
    
    cost_expr = ExpressionWrapper(
        F('quantity') * Coalesce(F('variant__cost_price'), F('variant__product__cost_price')),
        output_field=DecimalField()
    )
    retail_expr = ExpressionWrapper(
        F('quantity') * Coalesce(F('variant__selling_price'), F('variant__product__selling_price')),
        output_field=DecimalField()
    )
    
    result = qs.aggregate(
        total_cost=Sum(cost_expr),
        total_retail=Sum(retail_expr)
    )
    
    return {
        "total_cost_value": result["total_cost"] or Decimal("0.00"),
        "total_retail_value": result["total_retail"] or Decimal("0.00")
    }
