"""Join Ch03 03_02 + Ch05 05_02 (+ 03_01 share) into site/data/institution_master.json."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
OUT3 = ROOT / "outputs" / "ch03"
OUT5 = ROOT / "outputs" / "ch05"
DEST = ROOT / "site" / "data" / "institution_master.json"
MIN_N = 200


def is_edu(s: pd.Series) -> pd.Series:
    return s.astype(str).str.contains("Education", na=False)


def main() -> None:
    ch03 = pd.read_csv(OUT3 / "03_02_expected_output_index.csv")
    ch05 = pd.read_csv(OUT5 / "05_02_institution_top5.csv")
    share = pd.read_csv(
        OUT3 / "03_01_institution_rank.csv",
        usecols=["org_id", "global_share_ai4s"],
    ).drop_duplicates("org_id")

    ch03 = ch03.loc[is_edu(ch03["org_types"]) & (ch03["n_ai4s_obs"] >= MIN_N)].copy()
    ch05 = ch05.loc[is_edu(ch05["org_types"])].copy()
    merged = ch03.merge(
        ch05[["org_id", "n_ai4s", "top_rate", "top_rate_all", "high_impact_representation", "org_ror_id"]],
        on="org_id",
        how="inner",
        validate="one_to_one",
    )
    merged = merged.merge(share, on="org_id", how="left")

    rows = []
    for r in merged.itertuples(index=False):
        rows.append(
            {
                "org_id": r.org_id,
                "org_name": r.org_name,
                "org_country": r.org_country,
                "org_types": r.org_types,
                "org_ror_id": getattr(r, "org_ror_id", None) or "",
                "n_ai4s": int(round(float(r.n_ai4s))),
                "n_all": int(round(float(r.n_all))),
                "n_ai4s_exp": None if pd.isna(r.n_ai4s_exp) else round(float(r.n_ai4s_exp), 1),
                "discipline_adjusted_index": None
                if pd.isna(r.discipline_adjusted_index)
                else round(float(r.discipline_adjusted_index), 4),
                "global_share_ai4s": None if pd.isna(r.global_share_ai4s) else round(float(r.global_share_ai4s), 8),
                "top_rate": None if pd.isna(r.top_rate) else round(float(r.top_rate), 6),
                "top_rate_all": None if pd.isna(r.top_rate_all) else round(float(r.top_rate_all), 6),
                "high_impact_representation": None
                if pd.isna(r.high_impact_representation)
                else round(float(r.high_impact_representation), 4),
            }
        )
    rows.sort(key=lambda x: -x["n_ai4s"])
    n500 = sum(1 for x in rows if x["n_ai4s"] >= 500)
    countries = sorted({x["org_country"] for x in rows if x["org_country"]})
    payload = {
        "meta": {
            "status": "live",
            "window": "2019–2024",
            "org_type": "Education",
            "min_n_included": MIN_N,
            "default_threshold": 500,
            "n_ge_200": len(rows),
            "n_ge_500": n500,
            "n_countries": len(countries),
            "sources": ["03_02_expected_output_index.csv", "05_02_institution_top5.csv", "03_01_institution_rank.csv"],
        },
        "institutions": rows,
    }
    DEST.parent.mkdir(parents=True, exist_ok=True)
    DEST.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", DEST, "n200=", len(rows), "n500=", n500, "countries=", len(countries), "bytes=", DEST.stat().st_size)


if __name__ == "__main__":
    main()
