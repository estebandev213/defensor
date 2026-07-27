"""Build an ingestion-ready legal corpus from the reviewed catalog and local PDFs.

Requires pypdf. This is an offline preparation step; it does not call external
providers and does not write to the production database.
"""

from __future__ import annotations

import hashlib
import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = ROOT / "data" / "legal" / "corpus-legal-defensor-v1.json"
RAW_DIR = ROOT / "data" / "legal" / "raw"
OUTPUT_PATH = ROOT / "data" / "legal" / "corpus.seed.json"
REPORT_PATH = ROOT / "artifacts" / "ingest" / "pdf-build-report.json"
PARSER_VERSION = "pdf-pypdf-1.0.0"
CORPUS_VERSION = "peru-labor-v1-2026-07-26"


# Line ranges are applied after PDF text extraction. They remove unrelated
# newspaper pages and separate PDFs that contain more than one legal document.
RULES: dict[str, dict[str, Any]] = {
    "003-97-TR": {"file": "DS_003-97-TR_001-96-TR_002-97-TR.pdf", "start": 17, "end": 1575},
    "001-97-TR": {"file": "DS_001-97-TR.pdf"},
    "32322": {"file": "ley_32322.pdf", "start": 42, "end": 116},
    "007-2025-TR": {"file": "DS_007-2025-TR.PDF", "start": 17, "end": 199},
    "27735": {"file": "DS_005-2002-TR.pdf", "start": 17, "end": 160},
    "005-2002-TR": {"file": "DS_005-2002-TR.pdf", "start": 160},
    "30334": {"file": "ley_30334.pdf"},
    "012-2016-TR": {"file": "DS_012-2016-TR.pdf", "start": 137, "end": 324},
    "713": {"file": "DL_713.pdf", "start": 17, "end": 336},
    "012-92-TR": {"file": "DL_713.pdf", "start": 336},
    "008-2002-TR": {"file": "DS_008-2002-TR.pdf"},
    "301-2025-EF": {"file": "DS_301-2025-EF.PDF", "start": 0, "end": 37},
    "28806": {"file": "ley_28806.pdf", "start": 10, "end": 2291},
}


def deterministic_uuid(value: str) -> str:
    digest = bytearray(hashlib.sha256(value.encode("utf-8")).digest()[:16])
    digest[6] = (digest[6] & 0x0F) | 0x50
    digest[8] = (digest[8] & 0x3F) | 0x80
    return str(uuid.UUID(bytes=bytes(digest)))


def normalized_status(value: str) -> str:
    return {
        "vigente": "vigente",
        "vigente_modificada": "modificada",
    }.get(value, "desconocida")


def extract_lines(path: Path) -> list[str]:
    reader = PdfReader(str(path), strict=False)
    lines: list[str] = []
    for page in reader.pages:
        lines.extend((page.extract_text() or "").splitlines())
    return lines


def clean_lines(lines: list[str]) -> list[str]:
    cleaned: list[str] = []
    for original in lines:
        line = " ".join(original.replace("\u00a0", " ").split()).strip()
        if not line:
            if cleaned and cleaned[-1] != "":
                cleaned.append("")
            continue
        compact_upper = line.upper()
        if compact_upper in {"INICIO", "EDITORA PERÚ", "NORMAS LEGALES", "NORMAS LEGALES ACTUALIZADAS"}:
            continue
        if re.fullmatch(r"\d{1,4}", line):
            continue
        if re.fullmatch(r"ACTUALIZAD[AO]\s+\d{2}/\d{2}/\d{4}", compact_upper):
            continue
        if re.fullmatch(r"\d{1,4}NORMAS LEGALES.*", compact_upper):
            continue
        cleaned.append(line)
    while cleaned and cleaned[0] == "":
        cleaned.pop(0)
    while cleaned and cleaned[-1] == "":
        cleaned.pop()
    return cleaned


def article_chunks(text: str) -> list[tuple[str, str]]:
    lines = text.splitlines()
    pattern = re.compile(r"^((?:ART[ÍI]CULO|Artículo|ARTICULO)\s+[^:]{1,140})", re.IGNORECASE)
    starts = [index for index, line in enumerate(lines) if pattern.match(line.strip())]
    if not starts:
        return [("Documento completo", text)]

    chunks: list[tuple[str, str]] = []
    if starts[0] > 0:
        preamble = "\n".join(lines[: starts[0]]).strip()
        if len(preamble) >= 200:
            chunks.append(("Preámbulo", preamble))
    for position, start in enumerate(starts):
        end = starts[position + 1] if position + 1 < len(starts) else len(lines)
        body = "\n".join(lines[start:end]).strip()
        if body:
            label = " ".join(lines[start].split())[:160]
            chunks.append((label, body))
    return chunks


def split_long_chunk(label: str, text: str, max_chars: int = 12000) -> list[tuple[str, str]]:
    if len(text) <= max_chars:
        return [(label, text)]
    pieces: list[tuple[str, str]] = []
    lines = text.splitlines()
    current: list[str] = []
    current_length = 0
    part = 1
    for line in lines:
        if current and current_length + len(line) + 1 > max_chars:
            pieces.append((f"{label} (parte {part})", "\n".join(current).strip()))
            part += 1
            current = []
            current_length = 0
        current.append(line)
        current_length += len(line) + 1
    if current:
        pieces.append((f"{label} (parte {part})", "\n".join(current).strip()))
    return pieces


def build() -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    source_by_number = {str(source.get("norm_number")): source for source in catalog.get("sources", [])}
    sources: list[dict[str, Any]] = []
    documents: list[dict[str, Any]] = []
    chunks: list[dict[str, Any]] = []
    included: list[dict[str, Any]] = []
    excluded: list[dict[str, Any]] = []
    retrieved_at = catalog.get("retrieved_at", "2026-07-26")
    retrieved_timestamp = f"{retrieved_at}T00:00:00.000Z" if len(retrieved_at) == 10 else retrieved_at

    for norm_number, rule in RULES.items():
        source = source_by_number.get(norm_number)
        if source is None:
            excluded.append({"normNumber": norm_number, "reason": "missing_catalog_entry"})
            continue
        reason: str | None = None
        if not source.get("recommended_for_rag"):
            reason = "catalog_not_recommended"
        elif not source.get("official_url") or not source.get("source_domain"):
            reason = "missing_official_url"
        elif source.get("status") not in {"vigente", "vigente_modificada"}:
            reason = f"status_not_eligible:{source.get('status')}"
        path = RAW_DIR / str(rule["file"])
        if not path.exists():
            reason = "local_pdf_missing"
        if reason:
            excluded.append({"normNumber": norm_number, "file": rule.get("file"), "reason": reason})
            continue

        try:
            all_lines = extract_lines(path)
        except Exception as error:  # pragma: no cover - environment-specific PDF failures
            excluded.append({"normNumber": norm_number, "file": path.name, "reason": f"pdf_extract_error:{error}"})
            continue
        start_value = rule.get("start")
        end_value = rule.get("end")
        start = int(start_value) if start_value is not None else 0
        end = int(end_value) if end_value is not None else len(all_lines)
        selected = all_lines[start:end]
        cleaned = clean_lines(selected)
        raw_text = "\n".join(cleaned).strip()
        if len(raw_text) < 500:
            excluded.append({"normNumber": norm_number, "file": path.name, "reason": "insufficient_extractable_text", "characters": len(raw_text)})
            continue

        source_id = deterministic_uuid(f"source:{norm_number}:{source['official_url']}")
        document_id = deterministic_uuid(f"document:{source_id}:{CORPUS_VERSION}")
        content_hash = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()
        source_record = {
            "id": source_id,
            "title": source["title"],
            "normType": source["norm_type"],
            "officialPublisher": source["official_publisher"],
            "officialUrl": source["official_url"],
            "sourceDomain": source["source_domain"],
            "status": normalized_status(str(source["status"])),
            "retrievedAt": retrieved_timestamp,
            "contentHash": content_hash,
            "metadata": {
                "localFile": str(path.relative_to(ROOT)).replace("\\", "/"),
                "originalStatus": source.get("status"),
                "catalogPriority": source.get("priority"),
                "extractionMethod": "pypdf",
                "sectionRange": {"start": rule.get("start"), "end": rule.get("end")},
                "verificationNotes": source.get("verification_notes", ""),
            },
        }
        if source.get("norm_number") is not None:
            source_record["normNumber"] = source["norm_number"]
        if source.get("publication_date") is not None:
            source_record["publicationDate"] = source["publication_date"]
        if source.get("effective_from") is not None:
            source_record["effectiveFrom"] = source["effective_from"]
        if source.get("effective_to") is not None:
            source_record["effectiveTo"] = source["effective_to"]
        sources.append(source_record)
        documents.append({
            "id": document_id,
            "sourceId": source_id,
            "version": CORPUS_VERSION,
            "rawText": raw_text,
            "normalizedText": " ".join(raw_text.split()),
            "language": "es",
            "legalRegime": source.get("legal_regime", []),
            "topics": source.get("topics", []),
            "parserVersion": PARSER_VERSION,
            "createdAt": retrieved_timestamp,
        })

        chunk_index = 0
        for article_label, article_text in article_chunks(raw_text):
            for part_label, part_text in split_long_chunk(article_label, article_text):
                chunk_id = deterministic_uuid(f"chunk:{document_id}:{chunk_index}:{part_label}")
                chunk_record: dict[str, Any] = {
                    "id": chunk_id,
                    "documentId": document_id,
                    "sourceId": source_id,
                    "chunkIndex": chunk_index,
                    "articleLabel": part_label,
                    "headingPath": [],
                    "exactText": part_text,
                    "normalizedText": " ".join(part_text.split()),
                    "citationLabel": f"{source.get('norm_number') or source['title']} — {part_label}",
                    "legalRegime": source.get("legal_regime", []),
                    "topics": source.get("topics", []),
                    "status": normalized_status(str(source["status"])),
                    "tokenCount": max(1, len(part_text) // 4),
                    "metadata": {"localFile": str(path.relative_to(ROOT)).replace("\\", "/")},
                }
                if source.get("effective_from") is not None:
                    chunk_record["effectiveFrom"] = source["effective_from"]
                if source.get("effective_to") is not None:
                    chunk_record["effectiveTo"] = source["effective_to"]
                chunks.append(chunk_record)
                chunk_index += 1
        included.append({"normNumber": norm_number, "file": path.name, "characters": len(raw_text), "chunks": chunk_index})

    for source in catalog.get("sources", []):
        norm_number = source.get("norm_number")
        if norm_number is None or str(norm_number) in RULES:
            continue
        excluded.append({
            "normNumber": norm_number,
            "title": source.get("title"),
            "reason": "not_in_reviewed_ingestion_scope",
            "recommendedForRag": source.get("recommended_for_rag"),
            "status": source.get("status"),
        })

    corpus = {
        "version": CORPUS_VERSION,
        "parserVersion": PARSER_VERSION,
        "sources": sources,
        "documents": documents,
        "chunks": chunks,
    }
    OUTPUT_PATH.write_text(json.dumps(corpus, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps({
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "catalogPath": str(CATALOG_PATH.relative_to(ROOT)).replace("\\", "/"),
        "parserVersion": PARSER_VERSION,
        "included": included,
        "excluded": excluded,
        "totals": {"sources": len(sources), "documents": len(documents), "chunks": len(chunks)},
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(OUTPUT_PATH), "report": str(REPORT_PATH), "sources": len(sources), "documents": len(documents), "chunks": len(chunks), "excluded": len(excluded)}, ensure_ascii=False))


if __name__ == "__main__":
    build()
