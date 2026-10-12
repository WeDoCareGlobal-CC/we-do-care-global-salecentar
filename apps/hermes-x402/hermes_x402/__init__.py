"""hermes-x402-profit: an x402 payment rail with profit accounting.

Keccak-256, EIP-712 and EIP-3009 are implemented from scratch in this package
and validated against the published EIP-712 test vector; see
``tests/test_vectors.py``.
"""

from __future__ import annotations

__version__ = "1.0.0"

from .keccak import keccak256
from .eip3009 import Authorization, authorization_digest, build_authorization
from .eip712 import (
    Signature,
    address_from_private_key,
    hash_typed_data,
    recover_address,
    sign_digest,
)
from .ledger import Ledger, ProfitSummary
from .types import (
    PaymentPayload,
    PaymentRequiredResponse,
    PaymentRequirements,
    SettlementResponse,
    X402Error,
)
from .verification import settle, verify

__all__ = [
    "__version__",
    "Authorization",
    "Ledger",
    "PaymentPayload",
    "PaymentRequiredResponse",
    "PaymentRequirements",
    "ProfitSummary",
    "SettlementResponse",
    "Signature",
    "X402Error",
    "address_from_private_key",
    "authorization_digest",
    "build_authorization",
    "hash_typed_data",
    "keccak256",
    "recover_address",
    "settle",
    "sign_digest",
    "verify",
]