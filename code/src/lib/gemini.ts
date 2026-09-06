/**
 * Google Gemini AI Content Moderation Helper
 * Used by CampusConnect to auto-scan posts and comments for policy violations.
 */

export type ModerationSensitivity = "STRICT" | "MODERATE" | "LENIENT";

export interface ModerationResult {
  flagged: boolean;
  reason: string;
  category?: "HATE_SPEECH" | "HARASSMENT" | "EXPLICIT" | "ACADEMIC_DISHONESTY" | "SCAM" | "OTHER" | "NONE";
  confidence?: number;
}

const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Generates the system prompt based on sensitivity level.
 */
function getSystemPrompt(sensitivity: ModerationSensitivity): string {
  const sensitivityGuidelines = {
    STRICT: `Sensitivity: STRICT.
- Flag any coarse language, profanity, mild insults, heated uncivil arguments, or aggressive tone.
- Flag any hints of academic dishonesty, unauthorized file sharing, or cheating.
- Zero tolerance for any sexually suggestive references, harassment, or slurs.`,
    MODERATE: `Sensitivity: MODERATE.
- Flag hate speech, racism, sexism, discrimination, or slurs.
- Flag harassment, bullying, threats of physical harm, stalking, or doxxing.
- Flag sexually explicit, vulgar, or obscene content.
- Flag blatant academic dishonesty (selling exam leaks, paid coursework impersonation).
- Flag scams, phishing, drug distribution, or malicious links.
- Allow casual campus slang, friendly banter, and constructive criticism.`,
    LENIENT: `Sensitivity: LENIENT.
- Flag ONLY explicit, severe violations: credible threats of physical violence, severe hate speech, illegal drug dealing, and blatant harassment.
- Tolerate strong opinions, colloquial campus slang, heated academic debate, and mild swear words unless targeted as direct abuse.`,
  };

  return `You are the AI Content Safety Agent for CampusConnect, a private academic and social networking platform for colleges and universities.
Your responsibility is to analyze user-generated posts and comments for violations of community safety guidelines.

${sensitivityGuidelines[sensitivity]}

You must respond ONLY with valid JSON in this exact structure:
{
  "flagged": boolean,
  "reason": "Clear concise explanation of why the content was flagged, or empty string if safe",
  "category": "HATE_SPEECH" | "HARASSMENT" | "EXPLICIT" | "ACADEMIC_DISHONESTY" | "SCAM" | "OTHER" | "NONE",
  "confidence": number (from 0.0 to 1.0)
}`;
}

/**
 * Fallback regex moderation rule-engine if Gemini API is unreachable or budget-exceeded.
 */
function fallbackRuleBasedModeration(text: string): ModerationResult {
  const lower = text.toLowerCase();
  
  const hateSpeechPatterns = [
    /\b(nigg[a-z]*|fag[a-z]*|kike|chink|spic)\b/i,
  ];
  
  const threatPatterns = [
    /\b(kill you|murder you|beat you up|smash your|find where you live|gonna hurt you)\b/i,
  ];

  for (const pattern of hateSpeechPatterns) {
    if (pattern.test(lower)) {
      return {
        flagged: true,
        reason: "Content flagged by rule-based filter for offensive or derogatory language.",
        category: "HATE_SPEECH",
        confidence: 0.9,
      };
    }
  }

  for (const pattern of threatPatterns) {
    if (pattern.test(lower)) {
      return {
        flagged: true,
        reason: "Content flagged by rule-based filter for containing threats or abusive intent.",
        category: "HARASSMENT",
        confidence: 0.85,
      };
    }
  }

  return {
    flagged: false,
    reason: "",
    category: "NONE",
    confidence: 0.0,
  };
}

/**
 * Evaluates user-generated content for community policy violations.
 *
 * @param text The post or comment content to evaluate
 * @param sensitivity Moderation sensitivity level ('STRICT' | 'MODERATE' | 'LENIENT')
 * @returns ModerationResult with flagged status, reason, category, and confidence
 */
export async function moderateContent(
  text: string,
  sensitivity: ModerationSensitivity = "MODERATE"
): Promise<ModerationResult> {
  if (!text || text.trim().length === 0) {
    return { flagged: false, reason: "", category: "NONE", confidence: 0 };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("[Gemini Moderation] GEMINI_API_KEY not configured, using fallback rule engine.");
    return fallbackRuleBasedModeration(text);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: getSystemPrompt(sensitivity) }],
        },
        contents: [
          {
            parts: [{ text }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Gemini Moderation] API error HTTP ${response.status}:`, errText);
      return fallbackRuleBasedModeration(text);
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      console.warn("[Gemini Moderation] Empty response from Gemini, using fallback.");
      return fallbackRuleBasedModeration(text);
    }

    // Clean any accidental markdown code fences
    const cleanJson = rawContent.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
    const parsed: ModerationResult = JSON.parse(cleanJson);

    return {
      flagged: Boolean(parsed.flagged),
      reason: parsed.reason || (parsed.flagged ? "Flagged by AI moderation system." : ""),
      category: parsed.category || (parsed.flagged ? "OTHER" : "NONE"),
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.8,
    };
  } catch (error) {
    console.error("[Gemini Moderation] Failed to moderate content via API:", error);
    return fallbackRuleBasedModeration(text);
  }
}
