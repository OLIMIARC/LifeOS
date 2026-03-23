import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return Response.json({ error: "businessId required" }, { status: 400 });
  }

  try {
    // Check for existing briefing this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const existingBriefing = await sql`
      SELECT * FROM voice_briefings 
      WHERE business_id = ${businessId} 
      AND period_start >= ${startOfWeek.toISOString()}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (existingBriefing.length > 0) {
      return Response.json({ briefing: existingBriefing[0] });
    }

    // Generate new weekly briefing
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [sales, inventory, business, prevWeekSales] = await Promise.all([
      sql`
        SELECT * FROM sales 
        WHERE business_id = ${businessId} 
        AND sale_date >= ${startDate.toISOString()}
        ORDER BY sale_date DESC
      `,
      sql`SELECT * FROM inventory WHERE business_id = ${businessId}`,
      sql`SELECT * FROM businesses WHERE id = ${businessId} LIMIT 1`,
      sql`
        SELECT * FROM sales 
        WHERE business_id = ${businessId} 
        AND sale_date >= ${new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()}
        AND sale_date < ${startDate.toISOString()}
      `,
    ]);

    // Calculate key metrics
    const thisWeekRevenue = sales.reduce(
      (sum, s) => sum + parseFloat(s.price) * parseInt(s.quantity),
      0,
    );
    const thisWeekProfit = sales.reduce(
      (sum, s) =>
        sum + (parseFloat(s.price) - parseFloat(s.cost)) * parseInt(s.quantity),
      0,
    );
    const prevWeekRevenue = prevWeekSales.reduce(
      (sum, s) => sum + parseFloat(s.price) * parseInt(s.quantity),
      0,
    );

    const growthRate =
      prevWeekRevenue > 0
        ? ((thisWeekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100
        : 0;
    const margin =
      thisWeekRevenue > 0 ? (thisWeekProfit / thisWeekRevenue) * 100 : 0;

    // Find top performers
    const itemPerformance = {};
    sales.forEach((s) => {
      if (!itemPerformance[s.item_name]) {
        itemPerformance[s.item_name] = { revenue: 0, profit: 0, quantity: 0 };
      }
      itemPerformance[s.item_name].revenue +=
        parseFloat(s.price) * parseInt(s.quantity);
      itemPerformance[s.item_name].profit +=
        (parseFloat(s.price) - parseFloat(s.cost)) * parseInt(s.quantity);
      itemPerformance[s.item_name].quantity += parseInt(s.quantity);
    });

    const topByRevenue = Object.entries(itemPerformance).sort(
      (a, b) => b[1].revenue - a[1].revenue,
    )[0];

    const topByMargin = Object.entries(itemPerformance)
      .map(([name, data]) => ({
        name,
        margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
        profit: data.profit,
      }))
      .filter((item) => item.profit > 0)
      .sort((a, b) => b.margin - a.margin)[0];

    // Find items to reduce
    const itemSalesCount = {};
    sales.forEach((s) => {
      itemSalesCount[s.item_name] =
        (itemSalesCount[s.item_name] || 0) + parseInt(s.quantity);
    });

    const overstockedItems = inventory
      .filter((item) => {
        const sold = itemSalesCount[item.item_name] || 0;
        return item.quantity > 20 && sold < 5;
      })
      .slice(0, 2);

    // Build briefing text
    let briefingText = `Weekly Business Update for ${business[0]?.name}.\n\n`;

    if (growthRate > 0) {
      briefingText += `This week your business improved by ${growthRate.toFixed(1)} percent. `;
    } else if (growthRate < 0) {
      briefingText += `This week revenue decreased by ${Math.abs(growthRate).toFixed(1)} percent. `;
    } else {
      briefingText += `This week revenue remained stable. `;
    }

    briefingText += `Total revenue: $${thisWeekRevenue.toFixed(2)}. `;
    briefingText += `Profit margin: ${margin.toFixed(1)} percent.\n\n`;

    if (topByRevenue) {
      briefingText += `${topByRevenue[0]} drove traffic with $${topByRevenue[1].revenue.toFixed(2)} in sales. `;
    }

    if (topByMargin && topByMargin.name !== topByRevenue[0]) {
      briefingText += `${topByMargin.name} generated the strongest margins at ${topByMargin.margin.toFixed(1)} percent. `;
    }

    briefingText += `\n\n`;

    if (overstockedItems.length > 0) {
      briefingText += `Consider reducing inventory for: ${overstockedItems.map((i) => i.item_name).join(", ")}. `;
    }

    const lowStock = inventory.filter(
      (i) => i.quantity <= i.reorder_level && i.quantity > 0,
    );
    if (lowStock.length > 0) {
      briefingText += `Restock needed: ${lowStock
        .slice(0, 3)
        .map((i) => i.item_name)
        .join(", ")}. `;
    }

    briefingText += `\n\nKeep pushing forward. Your business is moving in the right direction.`;

    // For now, we'll store the text. Audio generation can be added later with TTS service
    const result = await sql`
      INSERT INTO voice_briefings (business_id, briefing_text, period_start, period_end)
      VALUES (${businessId}, ${briefingText}, ${startDate.toISOString()}, ${endDate.toISOString()})
      RETURNING *
    `;

    return Response.json({ briefing: result[0] });
  } catch (error) {
    console.error("Error generating voice briefing:", error);
    return Response.json(
      { error: "Failed to generate voice briefing" },
      { status: 500 },
    );
  }
}
