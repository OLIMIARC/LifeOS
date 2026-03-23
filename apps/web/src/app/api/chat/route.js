import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const { messages, businessId } = await request.json();

    if (!businessId) {
      return Response.json(
        { error: "Business ID is required" },
        { status: 400 },
      );
    }

    // Fetch context data
    const [sales, inventory, business] = await Promise.all([
      sql`SELECT * FROM sales WHERE business_id = ${businessId} ORDER BY sale_date DESC LIMIT 50`,
      sql`SELECT * FROM inventory WHERE business_id = ${businessId}`,
      sql`SELECT * FROM businesses WHERE id = ${businessId} LIMIT 1`,
    ]);

    const context = `
      Business Name: ${business[0]?.name}
      Category: ${business[0]?.category}
      
      Recent Sales:
      ${JSON.stringify(sales)}
      
      Inventory Status:
      ${JSON.stringify(inventory)}
    `;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_CREATE_APP_URL}/integrations/google-gemini-2-5-flash/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are LifeOS, a calm, intelligent, and serious AI business advisor for small business owners. 
            Your goal is to provide direct answers and actionable insights. Avoid generic advice.
            Use the provided business context to answer the user's questions. 
            Keep it professional and helpful. Focus on profit, efficiency, and growth.
            
            Context:
            ${context}`,
            },
            ...messages,
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error("AI Integration failed");
    }

    const aiResult = await response.json();
    const answer = aiResult.choices[0].message.content;

    return Response.json({ answer });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Chat failed" }, { status: 500 });
  }
}
