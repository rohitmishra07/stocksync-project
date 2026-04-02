"""Shared utility functions."""

import csv
import io


def parse_csv(file_obj):
    """Parse an uploaded CSV file and return a list of dicts."""
    decoded = file_obj.read().decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded))
    return list(reader)


def generate_reference_number(prefix, pk):
    """Generate a human-readable reference number."""
    return f"{prefix}-{str(pk)[:8].upper()}"
