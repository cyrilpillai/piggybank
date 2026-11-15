from decimal import Decimal
from typing import List, Dict, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.asset import Asset
from app.models.liability import Liability
from app.schemas.dashboard import DashboardResponse, NetWorthSummary, CategoryBreakdown, SubCategoryBreakdown
from app.services.fx import fx_service


async def calculate_dashboard(user: User, db: AsyncSession, target_currency: str) -> DashboardResponse:
    # 1. Fetch user assets & liabilities
    assets_result = await db.execute(select(Asset).where(Asset.user_id == user.id))
    assets: List[Asset] = list(assets_result.scalars().all())

    liabilities_result = await db.execute(select(Liability).where(Liability.user_id == user.id))
    liabilities: List[Liability] = list(liabilities_result.scalars().all())

    base_curr = target_currency.upper()

    # 2. Convert and aggregate assets
    total_assets = Decimal("0.00")
    asset_cat_totals: Dict[str, Dict] = {}

    for asset in assets:
        converted = await fx_service.convert_amount(
            amount=Decimal(str(asset.amount)),
            from_currency=asset.currency,
            to_currency=base_curr
        )
        total_assets += converted

        cat = asset.category
        if cat not in asset_cat_totals:
            asset_cat_totals[cat] = {"amount": Decimal("0.00"), "count": 0, "sub_categories": {}}
        asset_cat_totals[cat]["amount"] += converted
        asset_cat_totals[cat]["count"] += 1

        sub_cat = (asset.sub_category or "").strip() or "General"
        if sub_cat not in asset_cat_totals[cat]["sub_categories"]:
            asset_cat_totals[cat]["sub_categories"][sub_cat] = {"amount": Decimal("0.00"), "count": 0}
        asset_cat_totals[cat]["sub_categories"][sub_cat]["amount"] += converted
        asset_cat_totals[cat]["sub_categories"][sub_cat]["count"] += 1

    # 3. Convert and aggregate liabilities
    total_liabilities = Decimal("0.00")
    liability_cat_totals: Dict[str, Dict] = {}

    for liab in liabilities:
        converted = await fx_service.convert_amount(
            amount=Decimal(str(liab.amount)),
            from_currency=liab.currency,
            to_currency=base_curr
        )
        total_liabilities += converted

        cat = liab.category
        if cat not in liability_cat_totals:
            liability_cat_totals[cat] = {"amount": Decimal("0.00"), "count": 0}
        liability_cat_totals[cat]["amount"] += converted
        liability_cat_totals[cat]["count"] += 1

    # 4. Net worth & metrics
    net_worth = total_assets - total_liabilities

    debt_ratio = 0.0
    if total_assets > 0:
        debt_ratio = round(float((total_liabilities / total_assets) * 100), 2)

    # 5. Form category breakdown lists with percentages
    asset_breakdowns: List[CategoryBreakdown] = []
    for cat_name, data in sorted(asset_cat_totals.items(), key=lambda x: x[1]["amount"], reverse=True):
        amt = data["amount"]
        pct = round(float((amt / total_assets) * 100), 2) if total_assets > 0 else 0.0

        sub_breakdowns: List[SubCategoryBreakdown] = []
        if "sub_categories" in data and amt > 0:
            for sub_name, s_data in sorted(data["sub_categories"].items(), key=lambda x: x[1]["amount"], reverse=True):
                s_amt = s_data["amount"]
                s_pct = round(float((s_amt / amt) * 100), 2)
                sub_breakdowns.append(
                    SubCategoryBreakdown(
                        sub_category=sub_name,
                        total_amount=s_amt,
                        percentage=s_pct,
                        count=s_data["count"]
                    )
                )

        asset_breakdowns.append(
            CategoryBreakdown(
                category=cat_name,
                total_amount=amt,
                percentage=pct,
                count=data["count"],
                sub_categories=sub_breakdowns
            )
        )

    liability_breakdowns: List[CategoryBreakdown] = []
    for cat_name, data in sorted(liability_cat_totals.items(), key=lambda x: x[1]["amount"], reverse=True):
        amt = data["amount"]
        pct = round(float((amt / total_liabilities) * 100), 2) if total_liabilities > 0 else 0.0
        liability_breakdowns.append(
            CategoryBreakdown(
                category=cat_name,
                total_amount=amt,
                percentage=pct,
                count=data["count"]
            )
        )

    summary = NetWorthSummary(
        base_currency=base_curr,
        total_assets=total_assets,
        total_liabilities=total_liabilities,
        net_worth=net_worth,
        debt_to_asset_ratio=debt_ratio,
        asset_count=len(assets),
        liability_count=len(liabilities)
    )

    return DashboardResponse(
        summary=summary,
        asset_categories=asset_breakdowns,
        liability_categories=liability_breakdowns
    )
