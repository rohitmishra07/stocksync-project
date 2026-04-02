"""Barcode generation utilities."""

import io
import barcode
from barcode.writer import ImageWriter


def generate_barcode_image(code, barcode_format="code128"):
    """Generate a barcode image and return as bytes."""
    barcode_class = barcode.get_barcode_class(barcode_format)
    barcode_instance = barcode_class(code, writer=ImageWriter())

    buffer = io.BytesIO()
    barcode_instance.write(buffer)
    buffer.seek(0)
    return buffer


def generate_ean13(number_str):
    """Generate an EAN-13 barcode image."""
    return generate_barcode_image(number_str, "ean13")
