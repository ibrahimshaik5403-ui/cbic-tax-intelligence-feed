export interface CBICUpdate {
  notificationName?: string;
  updateCategory?: string;
  updateType?: string;
  notificationNo?: string;
  updatedDate?: string;
}

export function classifyCBICUpdate(item: CBICUpdate) {
  let service = "Indirect Tax";

  let documentType = item.updateType || "Notification";

  const category = item.updateCategory || "";

  const impactArea: string[] = [];

  const aiAction: string[] = [];

  const affectedAreas: string[] = [];

  let riskLevel = "Medium";

  const text = `
${item.notificationName ?? ""}
${item.updateCategory ?? ""}
${item.updateType ?? ""}
`
    .toLowerCase();

  //
  // Service classification
  //

  if (
    text.includes("gst") ||
    text.includes("central tax") ||
    text.includes("integrated tax")
  ) {
    service = "GST";

    impactArea.push(
      "GST Compliance",
      "GST Return Filing",
      "Input Tax Credit Review",
    );

    affectedAreas.push(
      "GSTR-1",
      "GSTR-3B",
      "Electronic Credit Ledger",
    );
  } else if (text.includes("custom")) {
    service = "Customs";

    impactArea.push(
      "Import Export Compliance",
      "Customs Duty",
    );

    affectedAreas.push(
      "Importers",
      "Exporters",
      "IEC Holders",
    );
  } else if (text.includes("excise")) {
    service = "Central Excise";

    impactArea.push(
      "Excise Duty Compliance",
    );

    affectedAreas.push(
      "Manufacturers",
    );
  }

  //
  // Document classification
  //

  if (text.includes("circular")) {
    documentType = "Circular";
  } else if (text.includes("order")) {
    documentType = "Order";
  } else {
    documentType = "Notification";
  }

  //
  // AI Actions
  //

  aiAction.push(
    "Identify affected taxpayers",
    "Review client applicability",
    "Analyse compliance impact",
    "Prepare advisory note if required",
  );

  //
  // Risk classification
  //

  if (
    text.includes("rate") ||
    text.includes("duty") ||
    text.includes("amend") ||
    text.includes("tax")
  ) {
    riskLevel = "High";
  }

  return {
    service,
    documentType,
    category,
    impactArea,
    aiAction,
    affectedAreas,
    riskLevel,
  };
}
