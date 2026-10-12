"""Network configuration for the x402 ``exact`` scheme on EVM chains.

Chain ids are CAIP-2 (``eip155:8453``) and the x402 v1 short names (``base``)
both appear in the wild, so each network carries both spellings.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class NetworkConfig:
    name: str  # x402 v1 short name, e.g. "base"
    caip2: str  # CAIP-2 id, e.g. "eip155:8453"
    chain_id: int
    usdc_asset: str
    usdc_name: str = "USDC"
    usdc_version: str = "2"
    usdc_decimals: int = 6

    @property
    def aliases(self) -> set[str]:
        return {self.name, self.caip2}


BASE_SEPOLIA = NetworkConfig(
    name="base-sepolia",
    caip2="eip155:84532",
    chain_id=84532,
    usdc_asset="0x036CbD53842c5426634e7929541eC2318f3dCF7e",
)

BASE_MAINNET = NetworkConfig(
    name="base",
    caip2="eip155:8453",
    chain_id=8453,
    usdc_asset="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
)

ETHEREUM_MAINNET = NetworkConfig(
    name="ethereum",
    caip2="eip155:1",
    chain_id=1,
    usdc_asset="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
)

NETWORKS: dict[str, NetworkConfig] = {
    config.name: config
    for config in (BASE_SEPOLIA, BASE_MAINNET, ETHEREUM_MAINNET)
}

# Testnets settle real value but are free to fund.
TESTNET_NAMES = frozenset({BASE_SEPOLIA.name})


def resolve_network(name: str) -> NetworkConfig | None:
    """Look up a network by short name or CAIP-2 id."""
    for config in NETWORKS.values():
        if name in config.aliases:
            return config
    return None


def is_testnet(name: str) -> bool:
    config = resolve_network(name)
    return config is not None and config.name in TESTNET_NAMES