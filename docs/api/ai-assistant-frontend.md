# BHOOMI-DRISHTI — Phase 10.3 Frontend AI Assistant Architecture & Documentation

## 1. Overview & Objective

Phase 10.3 introduces the **Interactive Evidence-Grounded Statutory AI Assistant** interface to BHOOMI-DRISHTI. The frontend serves as a transparent, evidence-backed workspace consuming the Phase 10.2 backend endpoint:

```http
POST /api/ai/assistant/query
```

The system is deliberately designed **NOT as an unconstrained chatbot or ChatGPT clone**, but as an evidence-grounded research and statutory interpretation tool. Every assertion is anchored to authoritative excerpts retrieved from published research documents, policy circulars, and cadastral survey manuals.

---

## 2. Core Architectural Principles

1. **"The model may generate language, but it must not generate evidence."**
2. **Backend-Owned Citation Metadata:** The frontend never fabricates citation indexes, hashes, quotes, or document IDs.
3. **No Artificial Confidence Scores:** Embedding similarity is an internal retrieval metric and is not misrepresented as statistical confidence probabilities (e.g., no "87% confidence").
4. **Categorical Grounding States:** The UI strictly adheres to backend categorical states (`GROUNDED`, `WEAK_EVIDENCE`, `NO_EVIDENCE`, `FALLBACK`).
5. **Zero New Dependencies:** Built exclusively using the existing React 19, TypeScript, Tailwind CSS, Lucide icons, and native fetch architecture without extra state or animation libraries.
6. **No Fake Streaming:** The API uses standard request/response. The UI presents an honest loading skeleton without simulated token typing.

---

## 3. Route & Navigation Architecture

### Primary Route
* **`/assistant`**: Dedicated single-turn Q&A workspace rendered within the standard `MainLayout`.

### Navigation Integration
* **Header Nav (`MainLayout.tsx`):** Added `Assistant` with the `Bot` icon located logically between `Research Hub` (`/research`) and `Knowledge` (`/knowledge`).
* Available to both unauthenticated and authenticated users.

### Contextual Entry Points
* **`KnowledgeSearchPage.tsx` Cross-Link:** Users querying semantic document search can transition to the assistant with one click.
* Supports URL query prefill:
  ```text
  /assistant?q=<encoded-query>
  ```
* Prefills the input field without auto-submitting, leaving full control to the user.

---

## 4. State Machine & Visual Language

The frontend strictly maps to the 4 categorical backend grounding statuses plus lifecycle states:

| Status | Visual Theme | Icon | UI Behavior |
| :--- | :--- | :--- | :--- |
| **INITIAL** | Neutral Slate | `Sparkles` | Displays educational feature highlights and 4 suggested statutory inquiry buttons. |
| **LOADING** | Pulse / Teal | `Loader2` | Honest progress skeleton with multi-stage indicators (retrieval, gating, reconciliation). |
| **GROUNDED** | Emerald / Green | `ShieldCheck` | Synthesized answer with interactive `[N]` citation chips and full source provenance cards. |
| **WEAK_EVIDENCE** | Amber / Orange | `AlertTriangle` | Cautionary banner explaining marginal relevance; displays verbatim excerpts instead of synthesis. |
| **NO_EVIDENCE** | Slate / Gray | `FileQuestion` | Informational card explaining no authorized documents met relevance thresholds. Not styled as an error. |
| **FALLBACK** | Sky / Blue | `Layers` | Notice that generative synthesis was unavailable; displays deterministic verbatim excerpts. |
| **ERROR** | Crimson / Red | `AlertCircle` | User-friendly error message with Retry and Dismiss actions. Stack traces are never exposed. |

---

## 5. Component Hierarchy & Responsibilities

```text
frontend/src/features/assistant/
├── types/
│   └── assistant.ts                  # GroundingStatus, CitationDTO, Request/Response DTOs, and adapter
├── services/
│   └── assistantService.ts           # apiClient wrapper with explicit 35s timeout and error translation
├── hooks/
│   └── useAssistantQuery.ts          # State lifecycle hook with request ID race-condition protection
├── components/
│   ├── AssistantQueryForm.tsx        # Controlled textarea (2-500 chars), Enter-to-submit, document filter
│   ├── GroundingStatusBadge.tsx      # Semantic badge with icon and explanatory description
│   ├── CitationChip.tsx              # Interactive inline [N] button opening provenance modal
│   ├── AssistantAnswerCard.tsx       # Answer parser, status context banners, disclaimer, and audit metadata
│   ├── CitationSourceList.tsx        # Grid container for cited source provenance cards
│   ├── EvidenceSourceCard.tsx        # Card displaying document metadata, excerpt quote, and inspect button
│   ├── AssistantEmptyState.tsx       # Welcoming onboarding state with 4 one-click suggested questions
│   └── AssistantLoadingSkeleton.tsx  # Accessible pulse skeleton representing honest request progress
└── pages/
    └── AssistantPage.tsx             # Main page wiring state, advisory banner, form, answers, and modal
```

---

## 6. Citation Interaction & Provenance Inspection

1. **Inline Citation Parsing:**
   * The answer text is parsed using regex `/(\[\d+\])/g`.
   * Valid bracketed references matching `citationIndex` are rendered as interactive `<CitationChip>` components.
   * If a citation reference is unmatched, it safely renders as plain text `[N]` without crashing.

2. **Modal Reuse:**
   * When an inline `[N]` chip or "Inspect Provenance" button is clicked, it opens the existing `EvidenceDetailsModal` from `features/knowledge/components/EvidenceDetailsModal.tsx`.
   * The `citationToEvidenceItem(citation: CitationDTO)` adapter maps backend citation fields directly to `EvidenceItem`, reusing existing copy helpers, document type badges, and verification policies without code duplication.

---

## 7. API Integration & Timeout Specifications

* **Endpoint:** `POST /api/ai/assistant/query`
* **Client Method:** `postJson<AssistantQueryResponseDTO>('/api/ai/assistant/query', request, 35000)`
* **Timeout:** Set to **35,000 ms** (35s) specifically for the assistant service. The global 5-second `DEFAULT_TIMEOUT_MS` is bypassed for this endpoint to support vector retrieval, similarity gating, and external synthesis.
* **Credentials:** `credentials: 'include'` travels automatically with every request via `apiClient.ts`, passing the HttpOnly session cookie when authenticated.

---

## 8. Security & Authorization UX

* **Anonymous Callers:** Unauthenticated users can query the assistant. The backend automatically restricts retrieval strictly to `PUBLISHED` research documents.
* **Authenticated Officials/Admins:** Automatically pass credentials; the backend permits cross-status queries (including drafts) where authorized.
* **No Client Authorization Logic:** The frontend never decides whether a document chunk is authorized. It solely renders the backend response.
* **Safe Language:** Loading states use neutral terminology ("Searching authorized statutory & research evidence..."), never exposing private document existence.

---

## 9. Accessibility (a11y) & Responsive UX

* **Form Semantics:** Accessible `sr-only` label for screen readers, visible focus ring (`focus:ring-2 focus:ring-teal-500/20`), and clear character limit feedback.
* **Status Announcements:** Loading state uses `role="status"` and `aria-live="polite"`.
* **Citation Accessibility:** Citation chips are keyboard-focusable `<button>` elements with descriptive `aria-label={`Citation [${index}]: ${title}`}`.
* **Color Blindness Safety:** Grounding status badges always pair distinct Lucide icons with textual labels, avoiding color-only indicators.
* **Responsive Layout:** Textarea is full-width; citations and source cards adapt from a 1-column mobile stack to a 2-column desktop grid.

---

## 10. Limitations & Deferred Capabilities

* **Single-Turn Q&A Only (Phase 10.3):** Multi-turn chat persistence, message history sidebars, and chat bubble interfaces are out of scope.
* **No Project/Parcel Scopes (Phase 10.4):** Contextual linking from parcel drawers, GIS layers, or scenario workspaces is deferred to Phase 10.4.
* **No Global Redesign (Phase 11):** Application-wide theme overhauls or landing page redesigns are deferred to Phase 11.
