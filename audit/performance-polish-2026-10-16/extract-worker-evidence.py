"""Read retained Playwright evidence without opening or rerunning a browser."""
import base64
import json
from pathlib import Path
from zipfile import ZipFile

folder = Path(__file__).resolve().parent
report = json.loads((folder / "worker-chromium.json").read_text(encoding="utf-8"))
evidence = []


def modes(node, found):
    if isinstance(node, dict):
        if "data-mode" in node:
            found.append({key: node[key] for key in ("data-mode", "data-renderer", "data-closing") if key in node})
        for value in node.values():
            modes(value, found)
    elif isinstance(node, list):
        for value in node:
            modes(value, found)


def collect(suite):
    for spec in suite.get("specs", []):
        for test in spec.get("tests", []):
            for result in test.get("results", []):
                item = {"title": spec["title"], "status": result["status"], "durationMs": result["duration"], "attachments": {}, "openingSnapshots": []}
                for attachment in result.get("attachments", []):
                    if attachment.get("body") and attachment.get("contentType") == "application/json":
                        item["attachments"][attachment["name"]] = json.loads(base64.b64decode(attachment["body"]))
                    if attachment.get("name") == "trace":
                        with ZipFile(attachment["path"]) as trace:
                            for name in trace.namelist():
                                if not name.endswith(".trace"):
                                    continue
                                for line in trace.read(name).decode("utf-8").splitlines():
                                    event = json.loads(line)
                                    if event.get("type") != "frame-snapshot":
                                        continue
                                    snapshot = event["snapshot"]
                                    found = []
                                    modes(snapshot.get("html"), found)
                                    if found:
                                        item["openingSnapshots"].append({"timestamp": snapshot.get("timestamp"), "url": snapshot.get("frameUrl"), "modes": found})
                evidence.append(item)
    for child in suite.get("suites", []):
        collect(child)


collect(report)
(folder / "worker-chromium-decoded-evidence.json").write_text(json.dumps(evidence, indent=2), encoding="utf-8")
for case in evidence:
    records = case["attachments"].get("native-worker-receipts", [])
    print(json.dumps({"title": case["title"], "status": case["status"], "records": len(records), "openingModes": case["openingSnapshots"]}))
