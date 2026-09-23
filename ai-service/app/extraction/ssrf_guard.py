import ipaddress
import socket
from urllib.parse import urlparse, urljoin
import httpx
from app.config import settings


class SSRFViolationError(Exception):
    """Raised when an outbound URL violates SSRF security boundaries."""
    pass


class DownloadError(Exception):
    """Raised when document retrieval fails."""
    pass


FORBIDDEN_NETWORKS = [
    # IPv4 loopback
    ipaddress.ip_network("127.0.0.0/8"),
    # RFC 1918 Private networks
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    # Link-local & cloud metadata (AWS/GCP/Azure 169.254.169.254)
    ipaddress.ip_network("169.254.0.0/16"),
    # Carrier-grade NAT
    ipaddress.ip_network("100.64.0.0/10"),
    # Unspecified & Broadcast
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("255.255.255.255/32"),
    # IPv6 loopback, link-local, private
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fe80::/10"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("::/128"),
]


def is_ip_forbidden(ip_str: str) -> bool:
    """Checks whether an IP address belongs to a forbidden/private network."""
    try:
        ip = ipaddress.ip_address(ip_str)
        return any(ip in net for net in FORBIDDEN_NETWORKS)
    except ValueError:
        return True


def validate_url(url: str) -> tuple[str, str, int]:
    """
    Validates scheme, parses hostname, resolves DNS, and checks against forbidden networks.
    Returns (validated_ip, original_hostname, port).
    Protects against DNS rebinding by resolving IPs first.
    """
    parsed = urlparse(url)
    scheme = parsed.scheme.lower()
    if scheme not in ("http", "https"):
        raise SSRFViolationError(f"Unsupported URL scheme '{scheme}'. Only http and https are allowed.")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFViolationError("URL does not contain a valid hostname.")

    port = parsed.port or (443 if scheme == "https" else 80)

    try:
        addr_infos = socket.getaddrinfo(hostname, port, socket.AF_UNSPEC, socket.SOCK_STREAM)
    except socket.gaierror as e:
        raise SSRFViolationError(f"DNS resolution failed for '{hostname}': {e}")

    if not addr_infos:
        raise SSRFViolationError(f"No IP addresses resolved for '{hostname}'.")

    # Inspect all resolved IP addresses
    resolved_ips = []
    for addr_info in addr_infos:
        ip_addr = addr_info[4][0]
        if is_ip_forbidden(ip_addr):
            raise SSRFViolationError(
                f"Access to private/internal IP address '{ip_addr}' for '{hostname}' is blocked."
            )
        resolved_ips.append(ip_addr)

    # Return primary validated IP to pin the connection
    return resolved_ips[0], hostname, port


async def safe_download_document(url: str) -> bytes:
    """
    Streams a document from a remote URL with strict SSRF defense:
    - Pins connection to pre-validated IP to eliminate DNS rebinding TOCTOU window
    - Manually validates each redirect target
    - Limits max redirects to 3
    - Streaming byte count enforces 25MB maximum document limit
    - Timeouts: 5s connect, 15s read
    """
    current_url = url
    redirect_count = 0

    while True:
        validated_ip, hostname, port = validate_url(current_url)
        parsed = urlparse(current_url)
        scheme = parsed.scheme.lower()

        # Connect directly to the validated IP to prevent DNS rebinding,
        # with the Host header set to the target hostname.
        request_url = f"{scheme}://{validated_ip}:{port}{parsed.path or '/'}"
        if parsed.query:
            request_url += f"?{parsed.query}"

        headers = {
            "Host": f"{hostname}:{port}" if (port not in (80, 443)) else hostname,
            "User-Agent": "BhoomiDrishti-AI-Service/0.1.0",
            "Accept": "application/pdf, text/plain, text/markdown, */*",
        }

        transport = httpx.AsyncHTTPTransport(verify=True)
        timeout = httpx.Timeout(
            settings.download_timeout_seconds,
            connect=settings.connect_timeout_seconds,
        )

        async with httpx.AsyncClient(transport=transport, timeout=timeout) as client:
            try:
                response = await client.get(
                    request_url,
                    headers=headers,
                    follow_redirects=False,
                )
            except httpx.RequestError as e:
                raise DownloadError(f"Failed to connect to '{hostname}': {e}")

            # Handle redirects manually with complete SSRF validation on the destination
            if response.status_code in (301, 302, 303, 307, 308):
                redirect_count += 1
                if redirect_count > settings.max_redirects:
                    raise SSRFViolationError(f"Exceeded maximum redirect limit of {settings.max_redirects} hops.")

                location = response.headers.get("Location")
                if not location:
                    raise DownloadError(f"Redirect response from '{hostname}' missing Location header.")

                # Resolve relative redirects
                next_url = urljoin(current_url, location)
                current_url = next_url
                continue

            if response.status_code != 200:
                raise DownloadError(f"Remote server returned HTTP {response.status_code} for document download.")

            # Check declared Content-Length
            content_length = response.headers.get("Content-Length")
            if content_length and int(content_length) > settings.max_document_size_bytes:
                raise DownloadError(
                    f"Document size ({content_length} bytes) exceeds maximum limit of {settings.max_document_size_bytes} bytes."
                )

            # Stream download in 64KB chunks to prevent memory exhaustion
            chunks = []
            total_bytes = 0
            async for chunk in response.aiter_bytes(chunk_size=65536):
                total_bytes += len(chunk)
                if total_bytes > settings.max_document_size_bytes:
                    raise DownloadError(
                        f"Document exceeded maximum limit of {settings.max_document_size_bytes} bytes during download."
                    )
                chunks.append(chunk)

            return b"".join(chunks)
