import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return Response.json({ error: "businessId required" }, { status: 400 });
  }

  try {
    // Get existing actions
    const existingActions = await sql`
      SELECT * FROM actions 
      WHERE business_id = ${businessId} 
      AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY is_completed ASC, created_at DESC
    `;

    // If we have recent actions, return them
    if (existingActions.length > 0) {
      return Response.json({ actions: existingActions });
    }

    // Otherwise, generate new actions based on business data
    const [sales, inventory, business] = await Promise.all([
      sql`SELECT * FROM sales WHERE business_id = ${businessId} ORDER BY sale_date DESC LIMIT 100`,
      sql`SELECT * FROM inventory WHERE business_id = ${businessId}`,
      sql`SELECT * FROM businesses WHERE id = ${businessId} LIMIT 1`,
    ]);

    const newActions = [];

    // Action 1: Restock low inventory
    const lowStockItems = inventory.filter(
      (item) => item.quantity <= item.reorder_level && item.quantity > 0,
    );
    for (const item of lowStockItems.slice(0, 3)) {
      newActions.push({
        action_text: `Restock ${item.item_name} soon (only ${item.quantity} units left)`,
        category: "inventory",
      });
    }

    // Action 2: Reduce overstock
    const last30Days = sales.filter(
      (s) =>
        new Date(s.sale_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    );
    const itemSalesMap = {};
    last30Days.forEach((s) => {
      itemSalesMap[s.item_name] =
        (itemSalesMap[s.item_name] || 0) + parseInt(s.quantity);
    });

    const slowMovingItems = inventory.filter((item) => {
      const soldCount = itemSalesMap[item.item_name] || 0;
      return item.quantity > 20 && soldCount < 5;
    });

    for (const item of slowMovingItems.slice(0, 2)) {
      newActions.push({
        action_text: `Reduce order quantity for ${item.item_name} (${item.quantity} in stock, slow-moving)`,
        category: "inventory",
      });
    }

    // Action 3: Promote high-margin items
    const highMarginItems = last30Days
      .map((s) => ({
        item_name: s.item_name,
        margin:
          ((parseFloat(s.price) - parseFloat(s.cost)) / parseFloat(s.price)) *
          100,
        revenue: parseFloat(s.price) * parseInt(s.quantity),
      }))
      .filter((item) => item.margin > 30)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 2);

    for (const item of highMarginItems) {
      newActions.push({
        action_text: `Promote ${item.item_name} (${item.margin.toFixed(0)}% margin, strong performer)`,
        category: "marketing",
      });
    }

    // Action 4: Price optimization
    const lowMarginItems = last30Days
      .filter((s) => {
        const margin =
          ((parseFloat(s.price) - parseFloat(s.cost)) / parseFloat(s.price)) *
          100;
        return margin < 15 && margin > 0;
      })
      .slice(0, 2);

    for (const item of lowMarginItems) {
      const currentMargin =
        ((parseFloat(item.price) - parseFloat(item.cost)) /
          parseFloat(item.price)) *
        100;
      newActions.push({
        action_text: `Consider raising price on ${item.item_name} (margin only ${currentMargin.toFixed(0)}%)`,
        category: "pricing",
      });
    }

    // Action 5: Best day/time recommendation
    const salesByDay = {};
    last30Days.forEach((s) => {
      const day = new Date(s.sale_date).toLocaleDateString("en-US", {
        weekday: "long",
      });
      salesByDay[day] =
        (salesByDay[day] || 0) + parseFloat(s.price) * parseInt(s.quantity);
    });

    const bestDay = Object.entries(salesByDay).sort((a, b) => b[1] - a[1])[0];
    if (bestDay) {
      newActions.push({
        action_text: `${bestDay[0]} is your strongest day ($${bestDay[1].toFixed(2)} avg) — schedule promotions accordingly`,
        category: "operations",
      });
    }

    // Insert new actions into database
    for (const action of newActions) {
      await sql`
        INSERT INTO actions (business_id, action_text, category)
        VALUES (${businessId}, ${action.action_text}, ${action.category})
      `;
    }

    // Fetch the newly created actions
    const actions = await sql`
      SELECT * FROM actions 
      WHERE business_id = ${businessId} 
      AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY is_completed ASC, created_at DESC
    `;

    return Response.json({ actions });
  } catch (error) {
    console.error("Error generating actions:", error);
    return Response.json(
      { error: "Failed to generate actions" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const { actionId, isCompleted, impactNotes } = await request.json();

    if (!actionId) {
      return Response.json({ error: "actionId required" }, { status: 400 });
    }

    await sql`
      UPDATE actions 
      SET is_completed = ${isCompleted}, 
          completed_at = ${isCompleted ? new Date() : null},
          impact_notes = ${impactNotes || null}
      WHERE id = ${actionId}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating action:", error);
    return Response.json({ error: "Failed to update action" }, { status: 500 });
  }
}
