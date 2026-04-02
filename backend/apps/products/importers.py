"""CSV product import logic."""

import csv
import io
from decimal import Decimal, InvalidOperation

from django.db import transaction

from .models import Product, ProductVariant


def import_products_from_csv(file_obj, tenant):
    """
    Import products from a CSV file.
    Expected columns: name, sku, barcode, description, brand,
                      cost_price, selling_price, category, low_stock_threshold
    Returns (created_count, error_list).
    """
    decoded = file_obj.read().decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded))

    created = 0
    errors = []

    with transaction.atomic():
        for row_num, row in enumerate(reader, start=2):
            try:
                name = row.get("name", "").strip()
                sku = row.get("sku", "").strip()

                if not name or not sku:
                    errors.append({"row": row_num, "error": "name and sku are required"})
                    continue

                category_name = row.get("category", "").strip()
                category_obj = None
                if category_name:
                    from .models import Category
                    category_obj, _ = Category.objects.get_or_create(
                        tenant=tenant,
                        name=category_name,
                        defaults={"sort_order": 0}
                    )

                product, prod_created = Product.objects.update_or_create(
                    tenant=tenant,
                    sku=sku,
                    defaults={
                        "name": name,
                        "slug": sku.lower().replace(" ", "-"),
                        "barcode": row.get("barcode", "").strip(),
                        "description": row.get("description", "").strip(),
                        "brand": row.get("brand", "").strip(),
                        "category": category_obj,
                        "cost_price": _safe_decimal(row.get("cost_price", "0")),
                        "selling_price": _safe_decimal(row.get("selling_price", "0")),
                        "low_stock_threshold": int(row.get("low_stock_threshold", "10") or "10"),
                    }
                )

                if prod_created:
                    # Default variant
                    ProductVariant.objects.create(
                        tenant=tenant,
                        product=product,
                        sku=product.sku,
                        barcode=product.barcode,
                        name="Default",
                    )
                created += 1

            except Exception as e:
                errors.append({"row": row_num, "error": str(e)})

    return created, errors


def _safe_decimal(value):
    try:
        return Decimal(value.strip() if value else "0")
    except (InvalidOperation, AttributeError):
        return Decimal("0")
