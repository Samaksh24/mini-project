import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const buildPrompt = (category) => `
You are assessing a photo of a municipal (city) problem reported by a resident.
The resident says the category is: "${category}".

Look at the image and reply with JSON only, using exactly these fields:
{
  "detectedIssue": "short name of the problem you see",
  "category": "the category you think it is",
  "severity": number from 0 to 10,
  "confidence": number from 0 to 1,
  "description": "one or two sentences describing the problem"
}

Severity guide:
- 8 to 10: immediate danger to people (open manhole, exposed live wires, large deep pothole on a busy road, major flooding)
- 4 to 7: a real nuisance or moderate hazard (overflowing garbage, medium pothole, broken streetlight, leaking pipe)
- 1 to 3: minor or cosmetic problem
- 0: no visible civic problem in the image

Set "confidence" low (below 0.3) if the image is unclear or does not show a civic problem.
`;

const fallback = (category) => ({
  detectedIssue: "",
  category,
  severity: 5,
  confidence: 0,
  description: "AI analysis unavailable",
});

export const analyzeComplaintImage = async (buffer, mimeType, category) => {
  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL,
      contents: [
        { inlineData: { mimeType, data: buffer.toString("base64") } },
        { text: buildPrompt(category) },
      ],
      config: { responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(response.text);

    const severity = Number(parsed.severity);
    const confidence = Number(parsed.confidence);

    if (Number.isNaN(severity) || Number.isNaN(confidence)) {
      throw new Error("Gemini returned non-numeric severity/confidence");
    }

    return {
      detectedIssue: String(parsed.detectedIssue ?? ""),
      category: String(parsed.category ?? category),
      severity: clamp(severity, 0, 10),
      confidence: clamp(confidence, 0, 1),
      description: String(parsed.description ?? ""),
    };
  } catch (error) {
    console.error("Gemini analysis failed:", error.message);
    return fallback(category);
  }
};