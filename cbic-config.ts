export interface CBICModule {

  name: string;

  taxId?: number;

}


export const CBIC_MODULES: CBICModule[] = [

  {
    name: "GST",
    taxId: 1000001
  },

  {
    name: "Customs",
    taxId: 1000002
  },

  {
    name: "Central Excise",
    taxId: 1000003
  },

  {
    name: "Service Tax",
    taxId: 1000004
  },

  {
    name: "HSNS Cess",
    taxId: 100005
  }

];