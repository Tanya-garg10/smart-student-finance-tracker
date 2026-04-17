import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Necessary for client-side API calls in Vite
});

export interface FinancialInsight {
  title: string;
  desc: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export const getFinancialAdvice = async (
  transactions: any[],
  categories: any[],
  monthlyBudget: number
): Promise<FinancialInsight[]> => {
  if (!import.meta.env.VITE_GROQ_API_KEY) {
    console.warn("Groq API Key missing. Returning fallback insights.");
    return [];
  }

  try {
    // Simplify data to reduce token usage
    const summary = transactions
      .filter(t => new Date(t.date).getMonth() === new Date().getMonth())
      .map(t => ({
        type: t.type,
        amount: t.amount,
        category: t.category,
        note: t.note
      }));

    const prompt = `
      As a Financial Advisor for a student, analyze these transactions for the current month:
      ${JSON.stringify(summary.slice(0, 50))}
      
      User's Monthly Budget: ₹${monthlyBudget}
      Available Categories: ${categories.map(c => c.name).join(', ')}

      Provide 3 actionable, highly specific financial insights.
      Each insight must follow this JSON format exactly:
      [
        { "title": "...", "desc": "...", "type": "info|success|warning|danger" }
      ]
      
      Rules:
      1. Be concise and friendly.
      2. Use Indian Rupee (₹) symbol.
      3. Focus on student life (food, travel, study, savings).
      4. DO NOT provide extra text, ONLY the JSON array.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 500,
    });

    const content = chatCompletion.choices[0]?.message?.content || '[]';
    // Clean potential markdown code blocks
    const jsonStr = content.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error fetching Groq insights:", error);
    return [];
  }
};

export const parseAICommand = async (
  input: string,
  categories: any[]
): Promise<any> => {
  if (!import.meta.env.VITE_GROQ_API_KEY) {
    throw new Error("Groq API Key missing.");
  }

  try {
    const prompt = `
      Parse this financial command from a student: "${input}"
      Available categories: ${categories.map(c => c.name).join(', ')}
      Current date: ${new Date().toISOString().split('T')[0]}
      
      Convert it to a valid JSON object following this schema:
      {
        "amount": number,
        "description": string,
        "category": "One of the available categories",
        "type": "income" | "expense",
        "date": "YYYY-MM-DD"
      }
      
      Strict Rules:
      1. Map the request to the closest available category.
      2. If date isn't mentioned, use today's date.
      3. ONLY return the raw JSON object, no other text.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 200,
    });

    const content = chatCompletion.choices[0]?.message?.content || '{}';
    const jsonStr = content.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error parsing AI command:", error);
    throw error;
  }
};

export const getAICoachResponse = async (
  messages: { role: 'user' | 'assistant' | 'system', content: string }[],
  context: {
    transactions: any[],
    categories: any[],
    budget: number,
    userName: string,
    goals: any[]
  }
): Promise<string> => {
  if (!import.meta.env.VITE_GROQ_API_KEY) {
    return "I'm sorry, my AI brain isn't connected right now. Please check your API key!";
  }

  try {
    const recentTransactions = context.transactions.slice(0, 30).map(t => ({
      date: t.date.split('T')[0],
      amount: t.amount,
      category: t.category,
      desc: t.description,
      type: t.type
    }));

    const systemPrompt = `
      You are "Finny", a friendly and intelligent AI Financial Coach for a student named ${context.userName || 'Student'}.
      
      User's Current Context:
      - Monthly Budget: ₹${context.budget}
      - Categories: ${context.categories.map(c => c.name).join(', ')}
      - Recent Transactions: ${JSON.stringify(recentTransactions)}
      - Active Goals: ${context.goals.map(g => `${g.name} (Target: ₹${g.targetAmount}, Saved: ₹${g.currentAmount})`).join(', ')}
      
      Rules for your personality:
      1. Be supportive, witty, and helpful. Use student-relatable language.
      2. Always give data-backed advice when possible based on the provided transactions.
      3. If they ask about spending, look at the recent transactions.
      4. Suggest ways to save for their goals.
      5. Keep responses concise but impactful. Use emojis sparingly.
      6. Use Indian Rupee (₹) symbol.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1000,
    });

    return chatCompletion.choices[0]?.message?.content || "I'm a bit lost. Can you rephrase that?";
  } catch (error) {
    console.error("Error with AI Coach:", error);
    return "I'm having a bit of trouble thinking right now. Let's try again in a moment!";
  }
};
