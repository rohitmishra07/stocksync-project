"""Barcode generation utilities."""

import io
import barcode
from barcode.writer import ImageWriter


def generate_barcode_image(code, barcode_format="ean13"):
    """
    Generate a barcode image and return it as bytes.

    Args:
        code: The barcode value
        barcode_format: Format (ean13, code128, upc, etc.)

    Returns:
        Bytes of the barcode image (PNG)
    """
    barcode_class = barcode.get_barcode_class(barcode_format)
    barcode_instance = barcode_class(str(code), writer=ImageWriter())

    buffer = io.BytesIO()
    barcode_instance.write(buffer)
    buffer.seek(0)
    return buffer.getvalue()


def generate_barcode_svg(code, barcode_format="code128"):
    """Generate a barcode as SVG string."""
    from barcode.writer import SVGWriter

    barcode_class = barcode.get_barcode_class(barcode_format)
    barcode_instance = barcode_class(str(code), writer=SVGWriter())

    buffer = io.BytesIO()
    barcode_instance.write(buffer)
    buffer.seek(0)
    return buffer.getvalue().decode("utf-8")
