import json
import time
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Dict, List, Optional
import httpx

_CURRENCIES_FILE = Path(__file__).parent.parent / "data" / "currencies.json"


def _load_currency_data():
    if _CURRENCIES_FILE.exists():
        with open(_CURRENCIES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            supported = [{"code": c["code"], "name": c["name"], "symbol": c["symbol"]} for c in data]
            rates = {c["code"]: float(c.get("default_usd_rate", 1.0)) for c in data}
            return supported, rates
    # Fallback if file missing
    return (
        [{"code": "USD", "name": "US Dollar", "symbol": "$"}, {"code": "INR", "name": "Indian Rupee", "symbol": "₹"}],
        {"USD": 1.0, "INR": 86.5}
    )


SUPPORTED_CURRENCIES, STATIC_USD_RATES = _load_currency_data()


class FXService:
    def __init__(self):
        # Cache structure: { "USD": { "rates": {...}, "timestamp": 12345678 } }
        self._cache: Dict[str, Dict] = {}
        self._cache_ttl_seconds = 21600  # 6 hours cache

    async def get_rates_for_base(self, base_currency: str) -> Dict[str, float]:
        base = base_currency.upper()
        now = time.time()
        
        # Check cache
        if base in self._cache and (now - self._cache[base]["timestamp"] < self._cache_ttl_seconds):
            return self._cache[base]["rates"]

        # Fetch reference rates from Frankfurter (Free, ECB-based, $0 cost)
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(f"https://api.frankfurter.app/latest?from={base}")
                if resp.status_code == 200:
                    data = resp.json()
                    rates = data.get("rates", {})
                    rates[base] = 1.0
                    self._cache[base] = {"rates": rates, "timestamp": now}
                    return rates
        except Exception:
            pass  # Fall through to synthetic calculation via fallback table

        # Fallback using static cross rates
        rates = {}
        base_to_usd = 1.0 / STATIC_USD_RATES.get(base, 1.0)
        for target, target_rate in STATIC_USD_RATES.items():
            rates[target] = target_rate * base_to_usd

        self._cache[base] = {"rates": rates, "timestamp": now}
        return rates

    async def convert_amount(self, amount: Decimal, from_currency: str, to_currency: str) -> Decimal:
        from_curr = from_currency.upper()
        to_curr = to_currency.upper()

        if from_curr == to_curr or amount == Decimal(0):
            return amount

        rates = await self.get_rates_for_base(from_curr)
        rate = rates.get(to_curr)

        if rate is None:
            # Fallback direct cross-calculation via static table
            from_in_usd = float(amount) / STATIC_USD_RATES.get(from_curr, 1.0)
            target_amount = from_in_usd * STATIC_USD_RATES.get(to_curr, 1.0)
            return Decimal(str(round(target_amount, 2)))

        converted = float(amount) * rate
        return Decimal(str(converted)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def get_supported_currencies(self) -> List[Dict[str, str]]:
        return SUPPORTED_CURRENCIES


fx_service = FXService()
