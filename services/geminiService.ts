
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY for Gemini is not set in environment variables. The app may not function correctly.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "FALLBACK_KEY_IF_YOU_HAVE_ONE_BUT_SHOULD_BE_SET_VIA_ENV" }); // Fallback only for extreme dev cases, ensure ENV is set.

const MODEL_NAME = "gemini-2.5-flash-preview-04-17";

export const generateAlignmentSummary = async (resume: string, jobDescriptions: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured. Please set the API_KEY environment variable.");
  }

  const prompt = `
    Analyze the following resume and job descriptions. Your goal is to help the candidate understand how well their profile aligns with the roles and provide actionable advice.

    You are an expert career coach. Be encouraging and constructive.

    **Resume:**
    \`\`\`
    ${resume}
    \`\`\`

    **Job Description(s):**
    \`\`\`
    ${jobDescriptions}
    \`\`\`

    **Analysis Required:**

    1.  **Overall Alignment Score (out of 10):** Briefly justify this score.
    2.  **Key Strengths Alignment:** Identify 3-5 key skills or experiences from the resume that strongly match the requirements in the job description(s). For each, briefly explain the connection.
    3.  **Potential Gaps or Areas for Improvement:** Identify 2-3 areas where the resume could be strengthened or tailored to better fit the job description(s). Suggest specific actions (e.g., "Highlight X project more," "Quantify Y achievement," "Consider mentioning Z skill if applicable").
    4.  **Tailoring Suggestions for Application:** Provide 2-3 concrete tips on how the candidate can tailor their application (resume or cover letter) for these specific roles.
    5.  **Keywords to Emphasize:** List 5-7 important keywords from the job description(s) that the candidate should try to incorporate naturally into their application materials.

    Format your response clearly using markdown, with headings for each section.
    `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
            temperature: 0.5, // Slightly creative but focused
        }
    });
    
    const text = response.text;
    if (!text) {
        throw new Error("Received an empty response from the AI.");
    }
    return text;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes("API_KEY_INVALID") || error.message.includes("API key")) {
             throw new Error("Invalid or missing Gemini API Key. Please check your configuration.");
        }
    }
    throw new Error("Failed to generate summary from AI. Please try again later.");
  }
};


export const generateCoverLetter = async (resume: string, jobDescriptions: string): Promise<string> => {
    if (!API_KEY) {
      throw new Error("Gemini API Key is not configured. Please set the API_KEY environment variable.");
    }
  
    const prompt = `
      As an expert career writer, generate a professional and compelling cover letter based on the provided resume and job description.
  
      **Resume:**
      \`\`\`
      ${resume}
      \`\`\`
  
      **Job Description:**
      \`\`\`
      ${jobDescriptions}
      \`\`\`
  
      **Instructions:**
      1.  **Structure:** Follow a standard professional cover letter format: introduction, body paragraphs, and conclusion.
      2.  **Personalization:** Directly address the requirements from the job description, using specific examples and skills from the resume to demonstrate suitability.
      3.  **Tone:** Maintain an enthusiastic, confident, and professional tone.
      4.  **Placeholders:** Use placeholders like [Your Name], [Your Address], [Your Phone Number], [Your Email], [Date], [Hiring Manager Name], [Company Name], and [Company Address] so the user can easily fill them in. Do NOT invent any contact details or names.
      5.  **Conciseness:** Keep the letter concise and focused, ideally around 3-4 paragraphs.
      6.  **Action-Oriented Closing:** End with a strong call to action, expressing eagerness for an interview.
  
      Generate only the text of the cover letter itself. Do not include any extra commentary or headings.
      `;
  
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
              temperature: 0.7, // A bit more creative for writing a letter
          }
      });
      
      const text = response.text;
      if (!text) {
          throw new Error("Received an empty response from the AI.");
      }
      return text;
  
    } catch (error) {
      console.error("Error calling Gemini API for cover letter:", error);
      if (error instanceof Error) {
          if (error.message.includes("API_KEY_INVALID") || error.message.includes("API key")) {
               throw new Error("Invalid or missing Gemini API Key. Please check your configuration.");
          }
      }
      throw new Error("Failed to generate cover letter from AI. Please try again later.");
    }
  };

  export const refineResumeForATS = async (resume: string, jobDescriptions: string): Promise<string> => {
    if (!API_KEY) {
      throw new Error("Gemini API Key is not configured. Please set the API_KEY environment variable.");
    }
  
    const prompt = `
      You are an expert resume writer specializing in optimizing resumes for Applicant Tracking Systems (ATS).
      Your task is to refine the provided resume to align perfectly with the given job description.

      **Resume to Refine:**
      \`\`\`
      ${resume}
      \`\`\`
  
      **Target Job Description:**
      \`\`\`
      ${jobDescriptions}
      \`\`\`
  
      **Instructions:**
      1.  **Integrate Keywords:** Seamlessly integrate relevant keywords, skills, and qualifications from the job description into the resume.
      2.  **Use Action Verbs:** Start bullet points with strong action verbs.
      3.  **Quantify Achievements:** Where possible, retain or emphasize quantifiable achievements (e.g., "Increased sales by 15%").
      4.  **Maintain Honesty:** Do not add skills or experiences that are not present in the original resume. Enhance what's there, don't invent.
      5.  **Standard Formatting:** Use a clean, standard format that is easily parsable by ATS. Avoid complex tables, columns, or graphics.
      6.  **Preserve Core Information:** Ensure all original sections (Experience, Education, Skills, etc.) and core information (names, dates, places) are preserved accurately.
      7.  **Output:** Return only the full text of the refined resume. Do not include any extra commentary, explanations, or headings like "Refined Resume". The output should be ready to be copied and pasted directly into a document.
      `;
  
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
              temperature: 0.4, // Low temperature for factual, structured rewriting
          }
      });
      
      const text = response.text;
      if (!text) {
          throw new Error("Received an empty response from the AI.");
      }
      return text.trim();
  
    } catch (error) {
      console.error("Error calling Gemini API for resume refinement:", error);
      if (error instanceof Error) {
          if (error.message.includes("API_KEY_INVALID") || error.message.includes("API key")) {
               throw new Error("Invalid or missing Gemini API Key. Please check your configuration.");
          }
      }
      throw new Error("Failed to refine resume from AI. Please try again later.");
    }
  };
