#!/usr/bin/env python3
"""Build the compact OpenPowerlifting dataset used by PowerliftingTotals.html.

OpenPowerlifting has no ranking API, but publishes a bulk CSV export
(https://openpowerlifting.gitlab.io/opl-csv/bulk-csv.html). This script reduces
that export to what the placement chart needs:

  * Raw, drug tested, full power (SBD) results only
  * Disqualified / no-show entries and entries without a total are dropped
  * Each lifter is mapped to an integer id so the page can count a lifter once
  * Per lifter, sex, country and IPF weight class only the results that could
    ever be that lifter's best squat, bench, deadlift or total for a
    "bodyweight <= X" query are kept (taken lightest first, a result is kept
    only if it beats all the lighter results on at least one of them)

Output: data/opl/entries.csv (sex,bodyweight,total,squat,bench,deadlift,country,lifter;
total is blank when it equals squat + bench + deadlift) and data/opl/meta.json.

Usage:
  python3 scripts/build_opl_data.py                      # download latest export
  python3 scripts/build_opl_data.py path/to/export.csv   # use a local CSV or zip
"""

import csv
import io
import json
import os
import sys
import urllib.request
import zipfile
from datetime import datetime, timezone

DOWNLOAD_URLS = [
    "https://openpowerlifting.gitlab.io/opl-csv/files/openpowerlifting-latest.zip",
    # Same file, taken straight from the GitLab CI job that builds it
    "https://gitlab.com/api/v4/projects/openpowerlifting%2Fopl-csv/jobs/artifacts/main/raw/files/openpowerlifting-latest.zip?job=data",
]

# IPF weight classes (upper limits); the last class has no upper limit
WEIGHT_CLASSES = {
    "M": [53, 59, 66, 74, 83, 93, 105, 120],
    "F": [43, 47, 52, 57, 63, 69, 76, 84],
}

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "opl")


def weight_class_index(sex, bodyweight):
    for i, limit in enumerate(WEIGHT_CLASSES[sex]):
        if bodyweight <= limit:
            return i
    return len(WEIGHT_CLASSES[sex])


def open_export(source):
    """Return (text stream, export file name) for a local CSV/zip or a download."""
    if source is None:
        data = None
        for url in DOWNLOAD_URLS:
            try:
                print(f"Downloading {url}", file=sys.stderr)
                with urllib.request.urlopen(url, timeout=600) as response:
                    data = response.read()
                break
            except Exception as error:  # try the next mirror
                print(f"  failed: {error}", file=sys.stderr)
        if data is None:
            sys.exit("Could not download the OpenPowerlifting export")
        source = io.BytesIO(data)
    elif source.endswith(".csv"):
        return open(source, newline="", encoding="utf-8"), os.path.basename(source)

    archive = zipfile.ZipFile(source)
    name = next(n for n in archive.namelist() if n.endswith(".csv") and "openpowerlifting-" in n)
    stream = io.TextIOWrapper(archive.open(name), encoding="utf-8", newline="")
    return stream, os.path.basename(name)


def main():
    source = sys.argv[1] if len(sys.argv) > 1 else None
    stream, export_name = open_export(source)

    lifter_ids = {}
    groups = {}  # (lifter, sex, country, class) -> [(bodyweight, total)]
    latest_meet = ""
    kept = 0

    for row in csv.DictReader(stream):
        if (row["Event"] != "SBD" or row["Equipment"] != "Raw" or row["Tested"] != "Yes"
                or row["Sex"] not in WEIGHT_CLASSES or row["Place"] in ("DQ", "DD", "NS")):
            continue
        try:
            total = float(row["TotalKg"])
            bodyweight = float(row["BodyweightKg"])
        except ValueError:
            continue
        if total <= 0 or bodyweight <= 0:
            continue
        # A few federations only report totals; those lifts are stored as 0
        lifts = tuple(max(0.0, float(row[column] or 0))
                      for column in ("Best3SquatKg", "Best3BenchKg", "Best3DeadliftKg"))

        lifter = lifter_ids.setdefault(row["Name"], len(lifter_ids))
        key = (lifter, row["Sex"], row["Country"], weight_class_index(row["Sex"], bodyweight))
        groups.setdefault(key, []).append((bodyweight, total) + lifts)
        latest_meet = max(latest_meet, row["Date"])
        kept += 1

    countries = sorted({key[2] for key in groups if key[2]})
    country_index = {name: i + 1 for i, name in enumerate(countries)}  # 0 = unknown

    rows = []
    for (lifter, sex, country, _), results in groups.items():
        best = [-1.0] * 4
        # Lightest first; on equal bodyweight, highest total first
        for result in sorted(results, key=lambda r: (r[0], -r[1])):
            values = result[1:]
            if any(value > top for value, top in zip(values, best)):
                rows.append((sex, result[0], *values, country_index.get(country, 0), lifter))
                best = [max(value, top) for value, top in zip(values, best)]
    rows.sort(key=lambda r: (r[0], r[1], r[2]))

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, "entries.csv"), "w", newline="") as out:
        out.write("sex,bodyweight,total,squat,bench,deadlift,country,lifter\n")
        for sex, bodyweight, total, squat, bench, deadlift, country, lifter in rows:
            # The total is left blank when it is just the sum of the lifts
            total_text = "" if abs(squat + bench + deadlift - total) < 0.005 else f"{total:g}"
            out.write(f"{sex},{bodyweight:g},{total_text},{squat:g},{bench:g},{deadlift:g},{country},{lifter}\n")

    meta = {
        "source": "OpenPowerlifting (https://www.openpowerlifting.org)",
        "export": export_name,
        "latestMeet": latest_meet,
        "built": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "filters": "Raw, drug tested, full power (SBD), valid totals",
        "results": kept,
        "lifters": len(lifter_ids),
        "rows": len(rows),
        "countries": countries,
        "weightClasses": WEIGHT_CLASSES,
    }
    with open(os.path.join(OUT_DIR, "meta.json"), "w") as out:
        json.dump(meta, out, indent=1)

    print(f"{kept} results from {len(lifter_ids)} lifters -> {len(rows)} rows", file=sys.stderr)


if __name__ == "__main__":
    main()
