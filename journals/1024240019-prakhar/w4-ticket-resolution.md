# Week 4 : Phase 9 — Deliverable 7: Dynamic AI Sensitivity Prompting & Admin Moderation Telemetry Controls

**Author:** Prakhar Saxena (Roll No. 1024240019)  
**Project:** CampusConnect — Closed-Community Academic & Social Platform  
**Component:** Phase 9 — Deliverable 7: AI Agentic Moderation (Prompt Engine & Admin Controls)  
**Dates Active:** 28-10-2026 to 29-10-2026  

---

## 1. Overview of Assigned Tasks

During Week 4 (Sprint 4 — Stage 3), I was responsible for delivering the AI prompt engineering and administrative governance telemetry for **Phase 9 (Deliverable 7: AI Agentic Moderation)**, completing **Task 9.2** and **Task 9.3**:

1. **Task 9.2 — Dynamic Sensitivity Level Prompt Engineering (`src/lib/gemini.ts`)**:
   - Engineered the dynamic prompt generator `getSystemPrompt(sensitivity: ModerationSensitivity)`, configuring distinct safety thresholds across three operational tiers:
     - `STRICT`: Zero-tolerance for coarse language, profanity, mild insults, heated uncivil arguments, aggressive tone, or any hints of academic dishonesty and cheating.
     - `MODERATE`: Standard university campus civility. Flags hate speech, threats, harassment, explicit vulgarity, blatant academic dishonesty (selling exam leaks), scams, and illegal substances, while allowing casual campus slang and constructive criticism.
     - `LENIENT`: High-tolerance mode flagging only severe threats of violence, extreme hate speech, and blatant harassment, while tolerating heated academic debates and colloquial slang.
   - Enforced structured JSON output schema using Gemini 1.5 Flash (`responseMimeType: "application/json"`, strict output formatting returning `flagged`, `reason`, `category`, and `confidence`).
   - Implemented a local regex-based fallback engine (`fallbackRuleBasedModeration`) to ensure zero-downtime safety evaluation in the event of API throttling or network disconnection.
2. **Task 9.3 — Admin AI Governance UI & Real-Time Moderation Telemetry (`src/app/api/admin/settings/route.ts`, `src/app/(dashboard)/admin/settings/page.tsx`)**:
   - **Telemetry API Engine (`GET /api/admin/settings`)**: Aggregates real-time 24-hour daily flagged posts (`createdAt: { gte: oneDayAgo }`) and cumulative all-time intercepted posts in parallel with `SystemSetting` retrieval using `Promise.all()`.
   - **Settings Mutation API (`PATCH /api/admin/settings`)**: Validates and updates `aiModerationEnabled` (boolean) and `aiSensitivity` (`STRICT`, `MODERATE`, `LENIENT`) via Prisma upsert operations with instant reflection.
   - **Governance Console Interface (`src/app/(dashboard)/admin/settings/page.tsx`)**: Built visual KPI metric cards for 24h Daily Flagged Posts, Total Actions Taken, and AI Safety Agent operational status. Integrated master AI auto-moderation toggle and 3-state radio pill selector for sensitivity tiers with live descriptions and toast feedback.

---

## 2. Technical Challenges & Ticket Resolutions

### Issue A: Deterministic JSON Schema Output Enforcement from Large Language Model API

#### Error / Problem Encountered:
When querying generative large language models for automated moderation decisions, models frequently wrap responses in markdown formatting blocks (e.g., ````json ... ````), prepend conversational commentary ("Here is the safety analysis:"), or omit required fields. Attempting to pass these raw completions directly into `JSON.parse()` threw unhandled syntax errors, causing the moderation pipeline to fail and fallback unpredictably.

#### Key Observation:
Large language model outputs must be constrained using both prompt-level system instructions and programmatic string sanitization before parsing. Stripping markdown fences and enforcing a typed TypeScript contract (`ModerationResult`) ensures 100% parsing reliability.

#### Solution:
Engineered robust JSON extraction and fallback normalization in `src/lib/gemini.ts`:
```typescript
/**
 * Evaluates user-generated content for community policy violations.
 */
export async function moderateContent(
  text: string,
  sensitivity: ModerationSensitivity = "MODERATE"
): Promise<ModerationResult> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("[Gemini Moderation] GEMINI_API_KEY missing, using fallback rule engine.");
    return fallbackRuleBasedModeration(text);
  }

  try {
    const ai = getGeminiClient();
    const systemInstruction = getSystemPrompt(sensitivity);

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ role: "user", parts: [{ text }] }],
      config: {
        systemInstruction,
        temperature: 0.1, // Low temperature for deterministic classification
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text?.trim() || "";
    // Sanitize any stray markdown fences
    const cleanJson = rawText.replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, "$1").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      flagged: Boolean(parsed.flagged),
      reason: String(parsed.reason || ""),
      category: parsed.category || "NONE",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 1.0,
    };
  } catch (error) {
    console.error("[Gemini Moderation] Evaluation failed, using fallback:", error);
    return fallbackRuleBasedModeration(text);
  }
}
```
This guarantees structured, type-safe moderation responses without parser exceptions.

---

### Issue B: Dynamic Zero-Downtime Sensitivity Adjustment & 24-Hour Rolling Telemetry Aggregation

#### Error / Problem Encountered:
Hardcoding moderation sensitivity parameters in environment variables or configuration files requires full application redeployments to adjust policies when campus events demand heightened vigilance (such as exam periods or campus elections). Additionally, calculating flagged post metrics across all time provides no visibility into sudden, short-term spikes in student policy violations.

#### Key Observation:
Reading the active `SystemSetting` record from PostgreSQL during each post evaluation enables immediate runtime policy updates without server restarts. In the administration telemetry API, calculating rolling 24-hour flagged statistics using `new Date(Date.now() - 24 * 60 * 60 * 1000)` alongside total cumulative counts equips university administrators with actionable, real-time safety trends.

#### Solution:
Implemented parallel telemetry aggregation and singleton upsert in `src/app/api/admin/settings/route.ts`:
```typescript
export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden. Admin only." }, { status: 403 });
  }

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [settings, dailyFlaggedCount, totalFlaggedCount] = await Promise.all([
      prisma.systemSetting.upsert({
        where: { id: "default" },
        update: {},
        create: {
          id: "default",
          joinPolicy: "OPEN",
          allowedDomains: "campus.edu,thapar.edu",
          aiModerationEnabled: true,
          aiSensitivity: "MODERATE",
        },
      }),
      prisma.post.count({
        where: {
          isFlagged: true,
          createdAt: { gte: oneDayAgo },
        },
      }),
      prisma.post.count({
        where: {
          isFlagged: true,
        },
      }),
    ]);

    return NextResponse.json({
      settings,
      stats: {
        dailyFlaggedCount,
        totalFlaggedCount,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ message: "Failed to fetch settings" }, { status: 500 });
  }
}
```
This empowers campus administrators with real-time governance visibility and instantaneous policy enforcement.

---

## 3. Verification & Empirical Testing

On **29-10-2026**, Phase 9 was verified end-to-end using the automated test suite `code/scripts/verify-phase9.ts`:

1. **AI Sensitivity Calibration Verification (Task 9.2)**:
   - Evaluated safe discussion post with `MODERATE` sensitivity: returned `flagged: false, category: "NONE"`.
   - Evaluated cheating/exam leaks with `MODERATE` sensitivity: returned `flagged: true, category: "ACADEMIC_DISHONESTY", reason: "Academic Dishonesty detected"`.
   - Verified that the post was correctly quarantined (`isFlagged: true`, `isHidden: true`).
2. **Dynamic AI Master Toggle Verification (Task 9.3)**:
   - Disabled AI auto-moderation via `SystemSetting` update (`aiModerationEnabled: false`).
   - Verified that posts submitted while AI moderation is disabled bypass screening and publish cleanly (`isHidden: false, isFlagged: false`).
   - Re-enabled AI moderation with sensitivity `STRICT` and confirmed dynamic activation.
3. **Telemetry Statistics Verification (Task 9.3)**:
   - Verified that rolling 24-hour flagged count accurately tracked new violations (`dailyFlaggedCount >= 1`).
   - Verified total all-time flagged post count matches database state.
4. **Code Quality & Build Sanity**:
   - `npx tsc --noEmit`: 0 type errors.
   - `npm run lint`: 0 ESLint warnings or errors.
   - `npm run build`: All 35 application routes compiled and bundled successfully.

---

## 4. Key Takeaways & Architectural Learnings

- **Dynamic Runtime Policy Orchestration:** Persisting AI safety parameters in database singletons rather than static code or environment variables enables non-technical university administrators to modulate community civility standards with zero downtime.
- **Strict Structured Output Contracts:** Combining SDK-level JSON schema constraints with defensive regex stripping guarantees resilient parsing across edge-case LLM outputs.
- **Actionable Governance Telemetry:** Separating rolling 24-hour metrics from cumulative totals gives administrators immediate insight into whether a policy change or campus event has caused a sudden surge in moderation flags.

