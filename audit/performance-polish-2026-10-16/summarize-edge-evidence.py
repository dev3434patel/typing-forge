"""Decode completed standard Playwright reports without starting a browser."""
import base64
import json
import sys
from pathlib import Path

folder = Path(__file__).resolve().parent
stem = sys.argv[1] if len(sys.argv) > 1 else "edge-complete"
report = json.loads((folder / f"{stem}.json").read_text(encoding="utf-8"))
cases = []
receipts = []
versions = set()


def collect(suite):
    for spec in suite.get("specs", []):
        for test in spec.get("tests", []):
            annotations = test.get("annotations", [])
            for annotation in annotations:
                if annotation.get("type") == "browser-runtime-version":
                    versions.add(annotation.get("description"))
            for result in test.get("results", []):
                item = {
                    "file": spec.get("file"),
                    "title": spec["title"],
                    "project": test.get("projectName"),
                    "status": result["status"],
                    "durationMs": result["duration"],
                    "annotations": annotations,
                    "errors": result.get("errors", []),
                }
                cases.append(item)
                decoded = {}
                for attachment in result.get("attachments", []):
                    if attachment.get("body") and attachment.get("contentType") == "application/json":
                        decoded[attachment["name"]] = json.loads(base64.b64decode(attachment["body"]))
                if decoded:
                    receipts.append({"title": spec["title"], "status": result["status"], "attachments": decoded})
    for child in suite.get("suites", []):
        collect(child)


collect(report)
summary = {
    "stats": report.get("stats"),
    "config": {
        "workers": report.get("config", {}).get("workers"),
        "globalTimeout": report.get("config", {}).get("globalTimeout"),
        "projects": [
            {key: project.get(key) for key in ("name", "timeout", "retries", "repeatEach")}
            for project in report.get("config", {}).get("projects", [])
        ],
    },
    "runtimeVersions": sorted(versions),
    "reportedAttempts": len(cases),
    "nonPassing": [case for case in cases if case["status"] != "passed"],
    "cases": cases,
}
(folder / f"{stem}-summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
(folder / f"{stem}-decoded-receipts.json").write_text(json.dumps(receipts, indent=2), encoding="utf-8")
print(json.dumps({key: value for key, value in summary.items() if key != "cases"}, indent=2))
