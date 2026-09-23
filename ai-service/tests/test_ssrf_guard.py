import pytest
from app.extraction.ssrf_guard import is_ip_forbidden, validate_url, SSRFViolationError


def test_is_ip_forbidden_blocks_private_and_metadata_ips():
    assert is_ip_forbidden("127.0.0.1") is True
    assert is_ip_forbidden("127.0.1.1") is True
    assert is_ip_forbidden("10.0.0.1") is True
    assert is_ip_forbidden("172.16.0.1") is True
    assert is_ip_forbidden("192.168.1.1") is True
    assert is_ip_forbidden("169.254.169.254") is True  # Cloud metadata
    assert is_ip_forbidden("0.0.0.0") is True
    assert is_ip_forbidden("::1") is True
    assert is_ip_forbidden("fe80::1") is True


def test_is_ip_forbidden_allows_public_ips():
    assert is_ip_forbidden("8.8.8.8") is False
    assert is_ip_forbidden("1.1.1.1") is False


def test_validate_url_rejects_unsupported_schemes():
    with pytest.raises(SSRFViolationError, match="Unsupported URL scheme"):
        validate_url("file:///etc/passwd")

    with pytest.raises(SSRFViolationError, match="Unsupported URL scheme"):
        validate_url("ftp://example.com/file.pdf")

    with pytest.raises(SSRFViolationError, match="Unsupported URL scheme"):
        validate_url("gopher://example.com")


def test_validate_url_rejects_loopback_and_local():
    with pytest.raises(SSRFViolationError, match="blocked"):
        validate_url("http://127.0.0.1/doc.pdf")

    with pytest.raises(SSRFViolationError, match="blocked"):
        validate_url("http://localhost:8080/secret")
