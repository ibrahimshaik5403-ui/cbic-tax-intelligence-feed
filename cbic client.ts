const BASE_URL = "https://taxinformation.cbic.gov.in";

export interface CBICUpdate {
  id: number;

  updatedDate: string;

  notificationNo?: string;

  notificationName?: string;

  updateType?: string;

  updateCategory?: string;

  docFilePath?: string;

  taxId: number;

  menuType: string;

  service: string;

  documentUrl: string;
}

interface CBICCategory {
  taxId: number;

  menuType: string;

  service: string;
}

interface CBICMenuResponse {
  menuInput?: string;

  menuName?: string;

  type?: string;
}

interface CBICApiItem {
  id: number;

  updatedDate: string;

  notificationNo?: string;

  notificationName?: string;

  updateType?: string;

  updateCategory?: string;

  docFilePath?: string;
}

// ------------------------------------------------
// Map Tax ID to Service Name
// ------------------------------------------------

function getServiceName(
  taxId: number,
): string {
  const map: Record<number, string> = {
    1000001: "GST",

    1000002: "Customs",

    1000003: "Central Excise",

    1000004: "Service Tax",

    100005: "HSNS Cess",
  };

  return map[taxId] ?? "CBIC";
}

// ------------------------------------------------
// Generate Home Token
// ------------------------------------------------

async function getHomeToken(): Promise<string> {
  const response = await fetch(
    `${BASE_URL}/api/authenticate-token`,
    {
      method: "POST",

      headers: {
        "Accept": "application/json",

        "Content-Type": "application/json",

        "language": "en",
      },

      body: JSON.stringify({}),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Token API failed ${response.status}`,
    );
  }

  const data: { id_token: string } = await response.json();

  console.log(
    "Token generated",
  );

  return data.id_token;
}

// ------------------------------------------------
// Discover CBIC Categories
// ------------------------------------------------

async function getCBICMenus(): Promise<CBICCategory[]> {
  const response = await fetch(
    `${BASE_URL}/api/cbicmenumsts`,
    {
      headers: {
        "Accept": "application/json",

        "language": "en",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Menu API failed ${response.status}`,
    );
  }

  const menus: CBICMenuResponse[] = await response.json();

  const categories: CBICCategory[] = [];

  for (const item of menus) {
    if (!item.menuInput) {
      continue;
    }

    try {
      const input: {
        taxId?: number;
        menuType?: string;
      } = JSON.parse(item.menuInput);

      if (
        input.taxId &&
        input.menuType
      ) {
        categories.push({
          taxId: Number(input.taxId),

          menuType: input.menuType,

          service: getServiceName(
            Number(input.taxId),
          ),
        });
      }
    } catch {
      // Ignore invalid menu entries
    }
  }

  return categories;
}

// ------------------------------------------------
// Create Public CBIC Document URL
// ------------------------------------------------

function createDocumentUrl(
  id: number,
  menuType: string,
): string {
  return (
    `${BASE_URL}/view-pdf/${id}/ENG/${menuType}`
  );
}

// ------------------------------------------------
// Fetch Documents By Tax Category
// ------------------------------------------------

async function fetchUpdatesByTaxId(
  taxId: number,
  menuType: string,
  service: string,
  token: string,
): Promise<CBICUpdate[]> {
  const response = await fetch(
    `${BASE_URL}/api/cbic-notification-msts/fetchUpdatesByTaxId/${taxId}`,
    {
      method: "GET",

      headers: {
        "Accept": "application/json",

        "authorization1": `homeToken ${token}`,

        "language": "en",
      },
    },
  );

  if (!response.ok) {
    console.log(
      "Failed",
      service,
      menuType,
      response.status,
    );

    return [];
  }

  const data: CBICApiItem[] = await response.json();

  return data.map(
    (item) => ({
      ...item,

      taxId,

      service,

      menuType,

      documentUrl: item.docFilePath
        ? item.docFilePath.startsWith("http")
          ? item.docFilePath
          : `${BASE_URL}${item.docFilePath}`
        : createDocumentUrl(
          item.id,
          menuType,
        ),
    }),
  );
}

// ------------------------------------------------
// Main Export
// ------------------------------------------------

export async function fetchCBICUpdates() {
  console.log(
    "Fetching CBIC updates",
  );

  const token = await getHomeToken();

  const categories = await getCBICMenus();

  console.log(
    "Categories found:",
    categories.length,
  );

  const allUpdates: CBICUpdate[] = [];

  for (
    const category of categories
  ) {
    console.log(
      `Fetching ${category.service} - ${category.menuType}`,
    );

    const updates = await fetchUpdatesByTaxId(
      category.taxId,
      category.menuType,
      category.service,
      token,
    );

    allUpdates.push(
      ...updates,
    );
  }

  const unique = Array.from(
    new Map(
      allUpdates.map(
        (item) => [
          `${item.id}-${item.service}-${item.menuType}`,

          item,
        ],
      ),
    ).values(),
  );

  console.log(
    "Total unique documents:",
    unique.length,
  );

  return unique;
}
