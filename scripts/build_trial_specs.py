"""Build static trial specs from the supplied workbook and ZIP/CSV assets.

Python 3 standard library only. Never modifies a source. No error-symbol assignment.
Run from any directory: python scripts/build_trial_specs.py [--check | --audit]
"""
import argparse
import csv
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import sys
import tempfile
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
HEADERS = {
    "Training": ["Trial", "Total n of Symbols", "N of Targets"],
    "PrePO": ["Trial", "Total n of Symbols", "N of Targets", "N of Symbols identified by agent", "Agent's verdict", "N of Misses", "N of FAs"],
    "PostPO": ["Trial", "Total n of Symbols", "N of Targets", "N of Symbols marked by agent (Hits + FAs)", "N of Targets marked by agent (Hits)", "Agent's verdict (based on D)", "N of Misses", "N of FAs"],
}


class SourceError(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise SourceError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode("utf-8")


def read_workbook(path):
    """Read cells and Excel cached formula results without evaluating formulas."""
    with zipfile.ZipFile(path) as archive:
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            strings = ["".join(t.text or "" for t in item.findall(".//m:t", NS))
                       for item in ET.fromstring(archive.read("xl/sharedStrings.xml")).findall("m:si", NS)]
        relationships = {item.attrib["Id"]: item.attrib["Target"] for item in
                         ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))}
        result = {}
        for sheet in ET.fromstring(archive.read("xl/workbook.xml")).findall("m:sheets/m:sheet", NS):
            target = relationships[sheet.attrib[f"{{{REL}}}id"]]
            target = target.lstrip("/") if target.startswith("/") else "xl/" + target
            rows = {}
            for row in ET.fromstring(archive.read(target)).findall("m:sheetData/m:row", NS):
                values = {}
                for cell in row.findall("m:c", NS):
                    cell_type = cell.attrib.get("t")
                    value = cell.find("m:v", NS)
                    if cell_type == "inlineStr":
                        parsed = "".join(t.text or "" for t in cell.findall(".//m:t", NS))
                    elif value is None or value.text is None:
                        require(cell.find("m:f", NS) is None, f"Uncached formula: {sheet.attrib['name']}!{cell.attrib['r']}")
                        continue
                    elif cell_type == "s":
                        parsed = strings[int(value.text)]
                    elif cell_type in ("str", "e", "b"):
                        require(cell_type != "e", f"Excel error: {cell.attrib['r']}")
                        parsed = value.text if cell_type == "str" else value.text == "1"
                    else:
                        number = float(value.text)
                        parsed = int(number) if number.is_integer() else number
                    values[cell.attrib["r"]] = parsed
                rows[int(row.attrib["r"])] = values
            result[sheet.attrib["name"]] = rows
        return result


def integer(value, location):
    require(type(value) is int and value >= 0, f"Expected nonnegative integer at {location}, got {value!r}")
    return value


def selected_rows(workbook, sheet, count):
    rows = workbook[sheet]
    header = rows[1]
    expected = {f"{chr(65 + i)}1": value for i, value in enumerate(HEADERS[sheet])}
    require(header == expected, f"Changed headers/selection columns in {sheet}; explicit source mapping must be reviewed.")
    trials = [(number, cells) for number, cells in sorted(rows.items())
              if type(cells.get(f"A{number}")) is int]
    require(len(trials) >= count, f"{sheet}: fewer than {count} trials")
    used = trials[:count]  # No selection column in the actual workbook.
    for index, (number, cells) in enumerate(used, 1):
        require(cells[f"A{number}"] == index, f"Nonsequential {sheet} trial IDs")
        for column in range(len(HEADERS[sheet])):
            require(f"{chr(65 + column)}{number}" in cells, f"Missing {sheet}!{chr(65 + column)}{number}")
    return used


def symbol_counts(data):
    rows = list(csv.DictReader(io.StringIO(data.decode("utf-8-sig"), newline="")))
    require(rows and {"shape", "center_x", "center_y", "is_small", "bg_dark"} <= rows[0].keys(), "Invalid symbol CSV")
    require(all(row["shape"] in ("L", "O", "T", "Q") for row in rows), "Unexpected symbol shape")
    for row in rows:
        for key in ("center_x", "center_y"):
            require(float(row[key]) >= 0, f"Invalid coordinate {key}")
    return {"total": len(rows), "targets": sum(row["shape"] in ("L", "O") for row in rows),
            "L": sum(row["shape"] == "L" for row in rows), "O": sum(row["shape"] == "O" for row in rows)}


def read_asset(root, relative):
    path = root / relative
    require(path.is_file(), f"Missing asset: {relative}")
    if path.suffix == ".zip":
        with zipfile.ZipFile(path) as archive:
            require(sorted(archive.namelist()) == ["stimulus_001.csv", "stimulus_001.jpg"], f"Unexpected archive members: {relative}")
            image = archive.read("stimulus_001.jpg")
            table = archive.read("stimulus_001.csv")
    else:
        image = path.read_bytes()
        table = (root / "tabellen" / (path.stem + ".csv")).read_bytes()
    require(image.startswith(b"\xff\xd8") and image.endswith(b"\xff\xd9"), f"Invalid JPEG: {relative}")
    return image, table, symbol_counts(table)


def build(root=ROOT, mapping=None):
    book_path = root / "Stimuli_log.xlsx"
    require(book_path.is_file(), "Missing Stimuli_log.xlsx")
    workbook = read_workbook(book_path)
    require(list(workbook)[:4] == ["Training", "PrePO", "PostPO", "Generator Settings"], "Required first four sheets missing/reordered")
    mapping = mapping if mapping is not None else json.loads((root / "scripts/source_asset_mapping.json").read_text(encoding="utf-8"))
    require(mapping["status"] == "confirmed", "Asset mapping is pending: confirm ZIP ordering and Main trial 24 (49.zip or 50.zip). No output written.")
    for exception in mapping.get("exceptions", []):
        assets = mapping[exception["sheet"]]
        require(assets[exception["trial_index"] - 1] == exception["selected_archive"], "Mapping contradicts confirmed exception")
        require(exception["superseded_archive"] not in assets, "Superseded archive must not be imported")
    generator = workbook["Generator Settings"]
    generator_by_trial = {cells[f"A{row}"]: (row, cells) for row, cells in generator.items() if row > 1 and f"A{row}" in cells}
    outputs, manifest = {}, {"workbook": "Stimuli_log.xlsx", "workbook_sha256": digest(book_path.read_bytes()),
                             "mapping_sha256": digest(encoded(mapping)), "assets": []}
    mapping_lines = ["# Source Mapping", "", "Generated by `python scripts/build_trial_specs.py`. Do not edit manually.", "",
                     "Excel verdicts are copied verbatim (Pass/Reject); no circle-count verdict inference.",
                     "Training: five existing temporary assets, checked against Training sheet. AI Practice: PrePO trials 1–10 of 16. Main: PostPO trials 1–30; rows 31–60 contain no complete specs.",
                     "ZIP assignment is explicitly recorded in scripts/source_asset_mapping.json; repeated internal filenames are extracted into unique phase/trial directories.", "",
                     *[f"**Confirmed exception — {e['sheet']} trial {e['trial_index']}:** use `{e['selected_archive']}`; ignore `{e['superseded_archive']}` (superseded, retained unchanged). {e['reason']}" for e in mapping.get("exceptions", [])],
                     "",
                     "| Excel sheet / row | Trial | Source asset | Image | Symbol table | Misses | False Alarms | Agent Verdict |",
                     "| --- | --- | --- | --- | --- | --- | --- | --- |"]
    for sheet, phase, count, filename in [("Training", "manual_training", 5, "training_trials.json"),
                                         ("PrePO", "ai_practice", 10, "pre_trials.json"),
                                         ("PostPO", "main_task", 30, "main_trials.json")]:
        specs = []
        sources = mapping[sheet]
        require(len(sources) == count and len(set(sources)) == count, f"{sheet}: wrong count or duplicate assets")
        for index, (excel_row, cells) in enumerate(selected_rows(workbook, sheet, count), 1):
            get = lambda column: cells[f"{column}{excel_row}"]
            total, targets = integer(get("B"), f"{sheet}!B{excel_row}"), integer(get("C"), f"{sheet}!C{excel_row}")
            relative = sources[index - 1]
            require(not PurePosixPath(relative).is_absolute() and ".." not in PurePosixPath(relative).parts and "\\" not in relative, "Unsafe source path")
            folder = "bilder/" if sheet == "Training" else "PrePO_Images/" if sheet == "PrePO" else "Post_PO_Images/"
            require(relative.startswith(folder), f"Wrong phase asset: {relative}")
            image, table, counts = read_asset(root, relative)
            require((counts["total"], counts["targets"]) == (total, targets), f"{sheet} trial {index}: asset counts {counts} disagree with Excel ({total}, {targets}): {relative}")
            stimulus_id = f"{phase}_{index:03d}"
            image_path = f"data/generated/assets/{stimulus_id}/stimulus.jpg"
            table_path = f"data/generated/assets/{stimulus_id}/symbols.csv"
            record = {"phase": phase, "trial_index": index, "stimulus_id": stimulus_id,
                      "image_path": image_path, "symbol_table_path": table_path,
                      "specified_total_symbols": total, "specified_targets": targets,
                      "specified_misses": None, "specified_false_alarms": None, "agent_verdict": None,
                      "source": {"workbook": "Stimuli_log.xlsx", "sheet": sheet, "row": excel_row, "asset": relative},
                      "asset_status": "temporary_existing_training" if sheet == "Training" else "supplied_source"}
            if sheet != "Training":
                verdict_col, misses_col, fa_col = ("E", "F", "G") if sheet == "PrePO" else ("F", "G", "H")
                misses, fas = integer(get(misses_col), f"{sheet}!{misses_col}{excel_row}"), integer(get(fa_col), f"{sheet}!{fa_col}{excel_row}")
                verdict = get(verdict_col)
                require(verdict in ("Pass", "Reject"), f"Unsupported Excel verdict: {verdict!r}")
                marked = integer(get("D"), f"{sheet}!D{excel_row}")
                require(misses <= targets and fas <= total - targets and marked == targets - misses + fas, f"Inconsistent Excel counts: {sheet} trial {index}")
                record.update(specified_misses=misses, specified_false_alarms=fas, agent_verdict=verdict, specified_agent_marked=marked)
                if sheet == "PostPO":
                    hits = integer(get("E"), f"PostPO!E{excel_row}")
                    require(hits == targets - misses, f"Inconsistent hits at PostPO trial {index}")
                    record["specified_hits"] = hits
                key = f"Pre {index}" if sheet == "PrePO" else index
                gen_row, gen = generator_by_trial[key]
                require((gen[f"P{gen_row}"], gen[f"Q{gen_row}"], gen[f"I{gen_row}"], gen[f"L{gen_row}"]) ==
                        (total, targets, counts["L"], counts["O"]), f"Generator Settings mismatch: {sheet} trial {index}")
                record["source"]["generator_settings_row"] = gen_row
            outputs[image_path], outputs[table_path] = image, table
            specs.append(record)
            manifest["assets"].append({"source": relative, "source_sha256": digest((root / relative).read_bytes()),
                                       "image_sha256": digest(image), "table_sha256": digest(table)})
            fields = [sheet + " / " + str(excel_row), index, relative, image_path, table_path,
                      record["specified_misses"], record["specified_false_alarms"], record["agent_verdict"]]
            mapping_lines.append("| " + " | ".join("—" if v is None else str(v) for v in fields) + " |")
        outputs[f"data/generated/{filename}"] = encoded(specs)
    # Preserve generator settings, notes and timing cells verbatim for source auditing.
    outputs["data/generated/source_cells.json"] = encoded(workbook)
    outputs["data/generated/build_manifest.json"] = encoded(manifest)
    mapping_lines.extend(["", "## Confirmed validation blocker", "",
        "Main Trial 28 -> Post_PO_Images/visual_search_data(54).zip.",
        "Problem: required orange misses = 2, available orange targets = 1.",
        "Excel: 100 symbols, 3 targets, 2 misses, 1 false alarm, Agent Verdict: Pass.",
        "Source data and the HIGH rule remain unchanged. Regular experiment start stays blocked pending a corrected stimulus or an explicit exception decision."])
    outputs["docs/SOURCE_MAPPING.md"] = ("\n".join(mapping_lines) + "\n").encode("utf-8")
    return outputs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Validate sources and byte-compare existing outputs; write nothing")
    parser.add_argument("--audit", action="store_true", help="Print source ZIP counts without assigning trials or writing files")
    args = parser.parse_args()
    try:
        if args.audit:
            for folder in ("PrePO_Images", "Post_PO_Images"):
                for path in sorted((ROOT / folder).glob("*.zip")):
                    print(path.relative_to(ROOT).as_posix(), read_asset(ROOT, path.relative_to(ROOT).as_posix())[2])
            return 0
        outputs = build()
        if args.check:
            for relative, data in outputs.items():
                require((ROOT / relative).is_file() and (ROOT / relative).read_bytes() == data, f"Missing/stale output: {relative}")
        else:
            # All inputs/records validate before the first output mutation. Each file is atomically replaced.
            for relative, data in outputs.items():
                path = ROOT / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as temp:
                    temp.write(data)
                    name = temp.name
                os.replace(name, path)
        print(f"OK: 5 training / 10 AI practice / 30 main trials; {len(outputs)} outputs {'verified' if args.check else 'built'}.")
        return 0
    except (SourceError, OSError, KeyError, ValueError, zipfile.BadZipFile) as error:
        print(f"SOURCE BLOCKER: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
