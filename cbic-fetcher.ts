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

menuType:string;

taxId:number;

}



export async function fetchCBICDocuments(
taxId:number,
menuType:string,
token:string
):Promise<CBICUpdate[]>{


const url =
`${BASE_URL}/api/cbic-notification-msts/fetchUpdatesByTaxId/${taxId}`;



const response =
await fetch(url,{

headers:{

"Accept":"application/json",

"authorization1":
`homeToken ${token}`,

"language":"en"

}

});



if(!response.ok){

console.log(
"Failed:",
taxId,
menuType,
response.status
);

return [];

}



const data =
await response.json();



return data.map((item:any)=>({

...item,

menuType,

taxId


}));


}