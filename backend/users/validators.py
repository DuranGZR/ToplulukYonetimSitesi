"""
File upload validators for HSD Platform
"""
from django.core.exceptions import ValidationError
import os


def validate_image_size(file):
    """
    Validate image file size (max 5MB)
    """
    max_size_mb = 5
    if file.size > max_size_mb * 1024 * 1024:
        raise ValidationError(f'Dosya boyutu {max_size_mb}MB\'dan küçük olmalıdır.')


def validate_image_extension(file):
    """
    Validate image file extension
    """
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in valid_extensions:
        raise ValidationError(f'Geçersiz dosya türü. İzin verilen: {", ".join(valid_extensions)}')


def validate_document_size(file):
    """
    Validate document file size (max 10MB)
    """
    max_size_mb = 10
    if file.size > max_size_mb * 1024 * 1024:
        raise ValidationError(f'Dosya boyutu {max_size_mb}MB\'dan küçük olmalıdır.')


def validate_document_extension(file):
    """
    Validate document file extension
    """
    valid_extensions = ['.pdf', '.doc', '.docx', '.txt', '.md']
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in valid_extensions:
        raise ValidationError(f'Geçersiz dosya türü. İzin verilen: {", ".join(valid_extensions)}')
