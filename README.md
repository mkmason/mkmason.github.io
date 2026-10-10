# mkmason.github.io

Training tools hosted on GitHub Pages.

## OpenPowerlifting rankings data

The Powerlifting Totals page compares your total with lifters from
[OpenPowerlifting](https://www.openpowerlifting.org). OpenPowerlifting has no ranking API, so
`scripts/build_opl_data.py` reduces their [bulk CSV export](https://openpowerlifting.gitlab.io/opl-csv/bulk-csv.html)
to raw, drug tested, full power (SBD) results and writes `data/opl/entries.csv` and `data/opl/meta.json`.

The `Update OpenPowerlifting data` GitHub Action reruns the script monthly. To update by hand:

```sh
python3 scripts/build_opl_data.py                 # downloads the latest export
python3 scripts/build_opl_data.py export.zip      # or use a downloaded zip/CSV
```

OpenPowerlifting data is in the public domain; see their site for details.
