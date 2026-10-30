const BASE_URL =
  "https://taxinformation.cbic.gov.in";


export interface CBICUpdate {

  id:number;

  updatedDate:string;

  notificationNo?:string;

  notificationName?:string;

  updateType?:string;

  updateCategory?:string;

  docFilePath?:string;

  taxId:number;

  menuType:string;

  service:string;

  documentUrl:string;

}



// ------------------------------------------------
// Map Tax ID to Service Name
// ------------------------------------------------

function getServiceName(taxId:number){


  const map:any = {

    1000001:"GST",

    1000002:"Customs",

    1000003:"Central Excise",

    1000004:"Service Tax",

    100005:"HSNS Cess"

  };


  return map[taxId] || "CBIC";

}





// ------------------------------------------------
// Generate Home Token
// ------------------------------------------------

async function getHomeToken(){


  const response =
    await fetch(

      `${BASE_URL}/api/authenticate-token`,

      {

        method:"POST",

        headers:{

          "Accept":
          "application/json",

          "Content-Type":
          "application/json",

          "language":
          "en"

        },

        body:
        JSON.stringify({})

      }

    );



  if(!response.ok){

    throw new Error(
      `Token API failed ${response.status}`
    );

  }



  const data =
    await response.json();



  console.log(
    "Token generated"
  );



  return data.id_token;

}





// ------------------------------------------------
// Discover CBIC Categories
// ------------------------------------------------

async function getCBICMenus(){


  const response =
    await fetch(

      `${BASE_URL}/api/cbicmenumsts`,

      {

        headers:{

          "Accept":
          "application/json",

          "language":
          "en"

        }

      }

    );



  if(!response.ok){

    throw new Error(
      `Menu API failed ${response.status}`
    );

  }



  const menus =
    await response.json();



  const categories:any[] = [];



  for(
    const item of menus
  ){



    if(!item.menuInput)
      continue;



    try{


      const input =
        JSON.parse(
          item.menuInput
        );



      if(
        input.taxId &&
        input.menuType
      ){


        const taxId =
          Number(input.taxId);



        categories.push({

          service:
          getServiceName(taxId),


          taxId,


          menuType:
          input.menuType


        });


      }


    }
    catch{

      continue;

    }


  }



  return categories;

}





// ------------------------------------------------
// Create Public CBIC Document URL
// ------------------------------------------------

function createDocumentUrl(

  id:number,

  menuType:string

){


  return (

    `${BASE_URL}/view-pdf/${id}/ENG/${menuType}`

  );

}





// ------------------------------------------------
// Fetch Documents By Tax Category
// ------------------------------------------------

async function fetchUpdatesByTaxId(

  taxId:number,

  menuType:string,

  service:string,

  token:string

):Promise<CBICUpdate[]>{



  const response =
    await fetch(

      `${BASE_URL}/api/cbic-notification-msts/fetchUpdatesByTaxId/${taxId}`,

      {

        method:"GET",

        headers:{

          "Accept":
          "application/json",


          "authorization1":
          `homeToken ${token}`,


          "language":
          "en"

        }

      }

    );



  if(!response.ok){


    console.log(

      "Failed",

      service,

      menuType,

      response.status

    );


    return [];

  }



  const data =
    await response.json();




  return data.map(

    (item:any)=>(


      {

        ...item,


        taxId,


        service,


        menuType,


        category:
        menuType,


        documentUrl:

        createDocumentUrl(

          item.id,

          menuType

        )


      }


    )

  );

}





// ------------------------------------------------
// Main Export
// ------------------------------------------------

export async function fetchCBICUpdates(){



  console.log(
    "Fetching CBIC updates"
  );



  const token =
    await getHomeToken();




  const categories =
    await getCBICMenus();




  console.log(

    "Categories found:",

    categories.length

  );




  let allUpdates:CBICUpdate[] = [];





  for(
    const category of categories
  ){



    console.log(

      `Fetching ${category.service} - ${category.menuType}`

    );




    const updates =
      await fetchUpdatesByTaxId(

        category.taxId,

        category.menuType,

        category.service,

        token

      );




    allUpdates.push(

      ...updates

    );



  }





  // Remove duplicates

  const unique =

    Array.from(

      new Map(

        allUpdates.map(

          item =>

          [

            `${item.id}-${item.service}-${item.menuType}`,

            item

          ]

        )

      ).values()

    );






  console.log(

    "Total unique documents:",

    unique.length

  );




  return unique;


}