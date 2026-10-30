export interface NewsItem {
  date: Date;
  title: string;
  html: string;
  link: string;
  id: string;

  service: string;
  documentType: string;
  category: string;

  impactArea: string[];
  aiAction: string[];
  affectedAreas: string[];

  riskLevel: string;
}

interface CBICItem {
  id: number;

  updatedDate?: string;

  notificationNo?: string;

  notificationName?: string;

  updateType?: string;

  updateCategory?: string;

  service?: string;

  docFilePath?: string;
}

const BASE_URL = "https://taxinformation.cbic.gov.in";

function getDocumentFolder(type?: string) {
  switch (type?.toLowerCase()) {
    case "notification":
      return "Notifications";

    case "circular":
      return "Circulars";

    case "order":
      return "Orders";

    case "instruction":
      return "Instructions";

    case "form":
      return "Forms";

    case "rule":
      return "Rules";

    case "act":
      return "Acts";

    case "regulation":
      return "Regulations";

    default:
      return "Notifications";
  }
}

function getDocumentLink(item: CBICItem): string {
  // Preferred CBIC API document path

  if (
    item.docFilePath &&
    item.docFilePath.startsWith("http")
  ) {
    return item.docFilePath;
  }

  // If API gives relative path

  if (item.docFilePath) {
    return `${BASE_URL}${item.docFilePath}`;
  }

  // Fallback generated PDF URL

  const folder = getDocumentFolder(item.updateType);

  return `${BASE_URL}/view-pdf/${item.id}/ENG/${folder}`;
}

function analyseCBICImpact(item: CBICItem) {
  const text = `
${item.service ?? ""}
${item.updateType ?? ""}
${item.notificationName ?? ""}
${item.updateCategory ?? ""}
`
    .toLowerCase();

  let service = item.service ?? "Indirect Tax";

  const impactArea: string[] = [];

  const aiAction: string[] = [];

  const affectedAreas: string[] = [];

  let riskLevel = "Medium";

  // GST

  if (
    text.includes("gst") ||
    text.includes("central tax") ||
    text.includes("integrated tax") ||
    text.includes("union territory tax")
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
      "ITC Reconciliation",
    );
  } // Customs

  else if (
    text.includes("custom")
  ) {
    service = "Customs";

    impactArea.push(
      "Import Export Compliance",
      "Customs Duty Impact",
    );

    affectedAreas.push(
      "Importers",
      "Exporters",
      "IEC Holders",
    );
  } // Excise

  else if (
    text.includes("excise")
  ) {
    service = "Central Excise";

    impactArea.push(
      "Excise Duty Compliance",
    );

    affectedAreas.push(
      "Manufacturers",
    );
  }

  // Risk

  if (
    text.includes("rate") ||
    text.includes("duty") ||
    text.includes("amend") ||
    text.includes("tax")
  ) {
    riskLevel = "High";
  }

  aiAction.push(
    "Identify affected taxpayers",
    "Analyse compliance impact",
    "Check applicability for clients",
    "Prepare advisory note if required",
  );

  return {
    service,

    documentType: item.updateType ?? "Notification",

    category: item.updateCategory ?? "",

    impactArea,

    aiAction,

    affectedAreas,

    riskLevel,
  };
}

export function parseCBICUpdates(
  data: CBICItem[],
): NewsItem[] {
  return data.map((item) => {
    const documentLink = getDocumentLink(item);

    const intelligence = analyseCBICImpact(item);

    return {
      date: new Date(
        item.updatedDate ??
          new Date().toISOString(),
      ),

      title: `${intelligence.service} | ${intelligence.documentType} | ${
        item.notificationNo ?? ""
      } - ${item.notificationName ?? ""}`,

      html: `

<h2>
CBIC Regulatory Update
</h2>


<p>
<b>Service:</b>
${intelligence.service}
</p>


<p>
<b>Document Type:</b>
${intelligence.documentType}
</p>


<p>
<b>Notification Number:</b>
${item.notificationNo ?? ""}
</p>


<p>
<b>Category:</b>
${intelligence.category}
</p>


<p>
<b>Date:</b>
${
        new Date(
          item.updatedDate ??
            new Date(),
        ).toDateString()
      }
</p>


<p>
<b>Risk Level:</b>
${intelligence.riskLevel}
</p>


<hr>


<h3>
Description
</h3>


<p>
${item.notificationName ?? ""}
</p>


<hr>


<h3>
Tax Impact Analysis
</h3>


<ul>

${
        intelligence.impactArea
          .map(
            (x) => `<li>${x}</li>`,
          )
          .join("")
      }

</ul>



<h3>
Affected Areas
</h3>


<ul>

${
        intelligence.affectedAreas
          .map(
            (x) => `<li>${x}</li>`,
          )
          .join("")
      }

</ul>



<h3>
CA Intelligence Recommended Actions
</h3>


<ul>

${
        intelligence.aiAction
          .map(
            (x) => `<li>${x}</li>`,
          )
          .join("")
      }

</ul>



<p>

<a href="${documentLink}"
target="_blank">

Open Original CBIC Document

</a>

</p>

`,

      link: documentLink,

      id: `${BASE_URL}/notification/${item.id}`,

      ...intelligence,
    };
  });
}
