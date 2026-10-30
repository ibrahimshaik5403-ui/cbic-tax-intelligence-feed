export interface NewsItem {

  date: Date;

  title: string;

  html: string;

  link: string;

  id: string;


  // CA Intelligence Fields

  service: string;

  documentType: string;

  category: string;

  impactArea: string[];

  aiAction: string[];

  affectedAreas: string[];

  riskLevel: string;

}



const BASE_URL =
"https://taxinformation.cbic.gov.in";



function getDocumentFolder(type:string){

  switch(type?.toLowerCase()){

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





function analyseCBICImpact(item:any){


  const text =
  `
  ${item.service}
  ${item.updateType}
  ${item.notificationName}
  ${item.updateCategory}
  `.toLowerCase();



  let service =
  item.service || "Indirect Tax";


  let impactArea:string[] = [];

  let aiAction:string[] = [];

  let affectedAreas:string[] = [];


  let riskLevel = "Medium";



  // GST Classification

  if(
    text.includes("gst") ||
    text.includes("central tax") ||
    text.includes("integrated tax") ||
    text.includes("union territory tax")
  ){

    service="GST";


    impactArea.push(
      "GST Compliance",
      "GST Return Filing",
      "Input Tax Credit Review"
    );


    affectedAreas.push(
      "GSTR-1",
      "GSTR-3B",
      "ITC Reconciliation"
    );

  }



  // Customs Classification

  else if(
    text.includes("custom")
  ){

    service="Customs";


    impactArea.push(
      "Import Export Compliance",
      "Customs Duty Impact"
    );


    affectedAreas.push(
      "Importers",
      "Exporters",
      "IEC Holders"
    );

  }



  // Central Excise Classification

  else if(
    text.includes("excise")
  ){

    service="Central Excise";


    impactArea.push(
      "Excise Duty Compliance"
    );


    affectedAreas.push(
      "Manufacturers"
    );

  }




  // Risk Analysis

  if(
    text.includes("rate") ||
    text.includes("duty") ||
    text.includes("amend") ||
    text.includes("tax")
  ){

    riskLevel="High";

  }




  // AI Recommended Actions

  aiAction.push(

    "Identify affected taxpayers",

    "Analyse compliance impact",

    "Check applicability for clients",

    "Prepare advisory note if required"

  );



  return {


    service,

    documentType:
    item.updateType || "Notification",

    category:
    item.updateCategory ?? "",


    impactArea,

    aiAction,

    affectedAreas,

    riskLevel


  };


}





export function parseCBICUpdates(

 data:any[]

):NewsItem[] {



return data.map((item:any)=>{



const folder =
getDocumentFolder(item.updateType);



const pdfLink =
`${BASE_URL}/view-pdf/${item.id}/ENG/${folder}`;





const intelligence =
analyseCBICImpact(item);





return {



date:

new Date(item.updatedDate),





title:

`${intelligence.service} | ${intelligence.documentType} | ${item.notificationNo} - ${item.notificationName}`,





html:


`

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
${item.notificationNo}
</p>



<p>
<b>Category:</b>
${intelligence.category}
</p>



<p>
<b>Date:</b>
${new Date(item.updatedDate).toDateString()}
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
${item.notificationName}
</p>




<hr>


<h3>
Tax Impact Analysis
</h3>


<ul>

${intelligence.impactArea
.map(
(x:string)=>`<li>${x}</li>`
)
.join("")}

</ul>




<h3>
Affected Areas
</h3>


<ul>

${intelligence.affectedAreas
.map(
(x:string)=>`<li>${x}</li>`
)
.join("")}

</ul>




<hr>



<h3>
CA Intelligence Recommended Actions
</h3>


<ul>

${intelligence.aiAction
.map(
(x:string)=>`<li>${x}</li>`
)
.join("")}

</ul>




<p>

<a href="${pdfLink}">
Open Original CBIC Document
</a>

</p>


`,





link:

pdfLink,





id:

`${BASE_URL}/notification/${item.id}`,





...intelligence



};



});



}