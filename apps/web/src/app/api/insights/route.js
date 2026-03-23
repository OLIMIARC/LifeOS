import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return Response.json(
        { error: "Business ID is required" },
        { status: 400 },
      );
    }

    // Check if we already have recent insights (last 24 hours)
    const existingInsights = await sql`
      SELECT * FROM insights 
      WHERE business_id = ${businessId} 
      AND created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
    `;

    if (existingInsights.length > 0) {
      return Response.json(existingInsights);
    }

    // Otherwise, generate new ones using AI
    const [sales, inventory, business] = await Promise.all([
      sql`SELECT * FROM sales WHERE business_id = ${businessId} ORDER BY sale_date DESC LIMIT 100`,
      sql`SELECT * FROM inventory WHERE business_id = ${businessId}`,
      sql`SELECT * FROM businesses WHERE id = ${businessId} LIMIT 1`,
    ]);

    const context = `
      Business: ${business[0]?.name} (${business[0]?.category})
      Sales (last 100): ${JSON.stringify(sales)}
      Inventory: ${JSON.stringify(inventory)}
    `;

    const aiResponse = await fetch(
      `${process.env.NEXT_PUBLIC_CREATE_APP_URL}/integrations/google-gemini-2-5-flash/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `Analyze this business data and provide 3-5 specific, actionable insights.
            Categorize each insight as 'warning' (risks), 'recommendation' (actions), or 'info' (observations).
            Output ONLY a JSON array of objects with keys: content, type.
            Example: [{"content": "Profit margin on bread is down 5%", "type": "warning"}]`,
            },
            { role: "user", content: context },
          ],
        }),
      },
    );

    if (aiResponse.ok) {
      const result = await aiResponse.json();
      const content = result.choices[0].message.content;
      try {
        const insights = JSON.parse(
          content.substring(content.indexOf("["), content.lastIndexOf("]") + 1),
        );

        // Save to DB
        for (const insight of insights) {
          await sql`
            INSERT INTO insights (business_id, content, type)
            VALUES (${businessId}, ${insight.content}, ${insight.type})
          `;
        }

        return Response.json(insights);
      } catch (e) {
        console.error("Failed to parse AI response as JSON", content);
      }
    }

    return Response.json([]);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to generate insights" },
      { status: 500 },
    );
  }
}
