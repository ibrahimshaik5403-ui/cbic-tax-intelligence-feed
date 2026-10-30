export interface CBICDocumentMenu {
  name: string;

  taxId: number;

  menuType: string;
}

export async function getCBICDocumentMenus() {
  const response = await fetch(
    "https://taxinformation.cbic.gov.in/api/cbicmenumsts",
  );

  const menus = await response.json();

  const documents: CBICDocumentMenu[] = [];

  for (const item of menus) {
    if (
      item.menuInput &&
      item.type === "INFO"
    ) {
      try {
        const input = JSON.parse(item.menuInput);

        if (
          input.taxId &&
          input.menuType
        ) {
          documents.push({
            name: item.menuName,

            taxId: input.taxId,

            menuType: input.menuType,
          });
        }
      } catch {
      }
    }
  }

  return documents;
}
