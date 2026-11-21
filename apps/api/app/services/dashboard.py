from decimal import Decimal
from datetime import datetime, timezone, date, timedelta
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.user import User
from app.models.asset import Asset
from app.models.liability import Liability
from app.models.net_worth_snapshot import NetWorthSnapshot
from app.schemas.dashboard import (
    DashboardResponse,
    NetWorthSummary,
    CategoryBreakdown,
    SubCategoryBreakdown,
    NetWorthHistoryPoint,
    NetWorthHistoryResponse,
)
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

    # Keep today's net worth snapshot in sync
    await upsert_today_snapshot(
        user=user,
        db=db,
        currency=base_curr,
        total_assets=total_assets,
        total_liabilities=total_liabilities,
    )

    return DashboardResponse(
        summary=summary,
        asset_categories=asset_breakdowns,
        liability_categories=liability_breakdowns
    )


async def upsert_today_snapshot(
    user: User,
    db: AsyncSession,
    currency: Optional[str] = None,
    total_assets: Optional[Decimal] = None,
    total_liabilities: Optional[Decimal] = None,
) -> NetWorthSnapshot:
    target_curr = (currency or user.base_currency or "INR").upper()
    today = datetime.now(timezone.utc).date()

    if total_assets is None or total_liabilities is None:
        assets_res = await db.execute(select(Asset).where(Asset.user_id == user.id))
        assets = list(assets_res.scalars().all())
        tot_a = Decimal("0.00")
        for a in assets:
            conv = await fx_service.convert_amount(
                amount=Decimal(str(a.amount)),
                from_currency=a.currency,
                to_currency=target_curr,
            )
            tot_a += conv

        liabs_res = await db.execute(select(Liability).where(Liability.user_id == user.id))
        liabs = list(liabs_res.scalars().all())
        tot_l = Decimal("0.00")
        for l in liabs:
            conv = await fx_service.convert_amount(
                amount=Decimal(str(l.amount)),
                from_currency=l.currency,
                to_currency=target_curr,
            )
            tot_l += conv

        total_assets = tot_a
        total_liabilities = tot_l

    net_worth = total_assets - total_liabilities

    existing_res = await db.execute(
        select(NetWorthSnapshot).where(
            and_(
                NetWorthSnapshot.user_id == user.id,
                NetWorthSnapshot.snapshot_date == today,
            )
        )
    )
    snapshot = existing_res.scalar_one_or_none()

    if snapshot:
        snapshot.total_assets = total_assets
        snapshot.total_liabilities = total_liabilities
        snapshot.net_worth = net_worth
        snapshot.currency = target_curr
        snapshot.updated_at = datetime.now(timezone.utc)
    else:
        snapshot = NetWorthSnapshot(
            user_id=user.id,
            snapshot_date=today,
            total_assets=total_assets,
            total_liabilities=total_liabilities,
            net_worth=net_worth,
            currency=target_curr,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(snapshot)

    await db.commit()
    await db.refresh(snapshot)
    return snapshot


async def get_net_worth_history(
    user: User,
    db: AsyncSession,
    range_str: str = "1M",
    target_currency: Optional[str] = None,
) -> NetWorthHistoryResponse:
    base_curr = (target_currency or user.base_currency or "INR").upper()
    today = datetime.now(timezone.utc).date()

    # Always ensure today has a fresh snapshot
    await upsert_today_snapshot(user=user, db=db, currency=base_curr)

    # Determine start_date
    range_upper = range_str.upper()
    if range_upper == "1M":
        target_start_date = today - timedelta(days=29)
    elif range_upper == "3M":
        target_start_date = today - timedelta(days=89)
    elif range_upper == "6M":
        target_start_date = today - timedelta(days=179)
    elif range_upper == "1Y":
        target_start_date = today - timedelta(days=364)
    else:  # "ALL" or default
        target_start_date = None

    # Fetch all user snapshots ordered by date ascending
    query = (
        select(NetWorthSnapshot)
        .where(NetWorthSnapshot.user_id == user.id)
        .order_by(NetWorthSnapshot.snapshot_date.asc())
    )
    result = await db.execute(query)
    all_snapshots = list(result.scalars().all())

    if not all_snapshots:
        today_str = today.isoformat()
        return NetWorthHistoryResponse(
            currency=base_curr,
            range=range_upper,
            start_date=today_str,
            end_date=today_str,
            net_change=Decimal("0.00"),
            percentage_change=0.0,
            points=[
                NetWorthHistoryPoint(
                    date=today_str,
                    net_worth=Decimal("0.00"),
                    total_assets=Decimal("0.00"),
                    total_liabilities=Decimal("0.00"),
                )
            ],
        )

    # Convert amounts to target currency if necessary
    snapshots_by_date = {}
    for s in all_snapshots:
        s_date = s.snapshot_date
        s_curr = s.currency.upper()
        if s_curr != base_curr:
            conv_assets = await fx_service.convert_amount(
                Decimal(str(s.total_assets)), s_curr, base_curr
            )
            conv_liabs = await fx_service.convert_amount(
                Decimal(str(s.total_liabilities)), s_curr, base_curr
            )
            conv_nw = conv_assets - conv_liabs
        else:
            conv_assets = Decimal(str(s.total_assets))
            conv_liabs = Decimal(str(s.total_liabilities))
            conv_nw = Decimal(str(s.net_worth))

        snapshots_by_date[s_date] = {
            "net_worth": conv_nw,
            "total_assets": conv_assets,
            "total_liabilities": conv_liabs,
        }

    first_recorded_date = all_snapshots[0].snapshot_date

    # Effective start date
    if target_start_date is None or target_start_date < first_recorded_date:
        effective_start = first_recorded_date
    else:
        effective_start = target_start_date

    # Find the most recent snapshot value on or before effective_start
    current_val = None
    for s in all_snapshots:
        if s.snapshot_date <= effective_start:
            current_val = snapshots_by_date[s.snapshot_date]
        else:
            break

    if current_val is None:
        current_val = snapshots_by_date[first_recorded_date]

    # Forward-fill every day from effective_start to today
    points: List[NetWorthHistoryPoint] = []
    curr_date = effective_start
    one_day = timedelta(days=1)

    while curr_date <= today:
        if curr_date in snapshots_by_date:
            current_val = snapshots_by_date[curr_date]

        points.append(
            NetWorthHistoryPoint(
                date=curr_date.isoformat(),
                net_worth=current_val["net_worth"],
                total_assets=current_val["total_assets"],
                total_liabilities=current_val["total_liabilities"],
            )
        )
        curr_date += one_day

    # Calculate net change & percentage change across the points
    if points:
        first_nw = points[0].net_worth
        last_nw = points[-1].net_worth
        net_change = last_nw - first_nw
        if first_nw != Decimal("0.00"):
            pct_change = round(float((net_change / abs(first_nw)) * 100), 2)
        elif net_change > 0:
            pct_change = 100.0
        elif net_change < 0:
            pct_change = -100.0
        else:
            pct_change = 0.0
    else:
        net_change = Decimal("0.00")
        pct_change = 0.0

    return NetWorthHistoryResponse(
        currency=base_curr,
        range=range_upper,
        start_date=points[0].date if points else today.isoformat(),
        end_date=points[-1].date if points else today.isoformat(),
        net_change=net_change,
        percentage_change=pct_change,
        points=points,
    )
