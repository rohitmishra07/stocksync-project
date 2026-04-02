"""Product filters."""

import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="selling_price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="selling_price", lookup_expr="lte")
    category = django_filters.UUIDFilter(field_name="category_id")
    brand = django_filters.CharFilter(lookup_expr="icontains")
    low_stock = django_filters.BooleanFilter(method="filter_low_stock")

    class Meta:
        model = Product
        fields = ["category", "brand", "is_active"]

    def filter_low_stock(self, queryset, name, value):
        if value:
            return queryset.filter(
                variants__stock_levels__quantity__lt=models.F(
                    "low_stock_threshold"
                )
            ).distinct()
        return queryset
