import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from barcode import Code128
from barcode.writer import ImageWriter
from .models import Product

def generate_barcode_pdf(product_ids, label_size="38x21"):
    """
    Generate a PDF sheet of barcode labels for given products.
    Supported label_size format: WxH in mm.
    """
    products = Product.objects.filter(id__in=product_ids)
    
    # Parse label size
    if label_size == "avery5160":
        w_mm, h_mm = 66.6, 25.4
    elif label_size == "3x2":
        w_mm, h_mm = 76.2, 50.8
    else:
        try:
            w_mm, h_mm = map(float, label_size.split('x'))
        except ValueError:
            w_mm, h_mm = 38, 21

    width = w_mm * mm
    height = h_mm * mm
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    page_w, page_h = A4
    
    # Grid calculation
    cols = int(page_w // width)
    rows = int(page_h // height)
    margin_x = (page_w - (cols * width)) / 2
    margin_y = (page_h - (rows * height)) / 2
    
    curr_col = 0
    curr_row = 0
    
    for product in products:
        # Drawing cell
        x = margin_x + (curr_col * width)
        y = page_h - margin_y - ((curr_row + 1) * height)
        
        # Product Name (small font)
        c.setFont("Helvetica", 6)
        c.drawString(x + 2*mm, y + height - 5*mm, product.name[:25])
        
        # Barcode
        code_obj = Code128(product.barcode, writer=ImageWriter())
        barcode_buffer = io.BytesIO()
        code_obj.write(barcode_buffer, options={"write_text": False, "module_height": 5.0})
        
        from reportlab.lib.utils import ImageReader
        img = ImageReader(barcode_buffer)
        c.drawImage(img, x + 2*mm, y + 2*mm, width - 4*mm, height - 10*mm)
        
        # SKU text
        c.setFont("Helvetica-Bold", 7)
        c.drawCentredString(x + width/2, y + 1*mm, f"{product.sku} | {product.barcode}")

        curr_col += 1
        if curr_col >= cols:
            curr_col = 0
            curr_row += 1
            if curr_row >= rows:
                c.showPage()
                curr_row = 0

    c.save()
    buffer.seek(0)
    return buffer
