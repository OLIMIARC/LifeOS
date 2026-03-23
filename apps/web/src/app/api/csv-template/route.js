export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (!type || !["sales", "inventory"].includes(type)) {
    return Response.json(
      { error: "type must be 'sales' or 'inventory'" },
      { status: 400 },
    );
  }

  let csvContent = "";
  let filename = "";

  if (type === "sales") {
    csvContent = "item_name,category,quantity,price,cost,sale_date\n";
    csvContent += "Coca Cola,Beverages,2,1.50,0.80,2024-03-20\n";
    csvContent += "Bread,Bakery,1,2.00,1.20,2024-03-20\n";
    csvContent += "Rice 1kg,Grains,3,5.00,3.50,2024-03-20\n";
    csvContent += "Cooking Oil,Grocery,1,8.00,6.00,2024-03-20\n";
    csvContent += "Milk,Dairy,2,3.50,2.50,2024-03-20\n";
    filename = "sales_template.csv";
  } else {
    csvContent = "item_name,category,quantity,unit_cost,reorder_level\n";
    csvContent += "Coca Cola,Beverages,50,0.80,20\n";
    csvContent += "Bread,Bakery,30,1.20,15\n";
    csvContent += "Rice 1kg,Grains,100,3.50,25\n";
    csvContent += "Cooking Oil,Grocery,40,6.00,10\n";
    csvContent += "Milk,Dairy,25,2.50,12\n";
    filename = "inventory_template.csv";
  }

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
