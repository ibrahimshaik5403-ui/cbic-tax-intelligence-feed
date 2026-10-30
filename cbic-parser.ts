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

  id:number;

  updatedDate?:string;

  notificationNo?:string;

  notificationName?:string;

  updateType?:string;

  updateCategory?:string;

  service?:string;

  docFilePath?:string;

}



interface ParseOptions {

  maxAgeDays?:number;

}



const BASE_URL =
"https://taxinformation.cbic.gov.in";



function getDocumentFolder(type?:string){

switch(
(type ?? "")
.toLowerCase()
.replace(/s$/,"")
){

case "notification":
return "Notifications";

case "circular":
return "Circulars";

case "order":
return "Orders";

case "instruction":
return "Instructions";

default:
return "Notifications";

}

}




function getDocumentLink(
item:CBICItem
){

/*
 NEVER use Windows server path
*/

if(
item.docFilePath &&
item.docFilePath.startsWith("http")
){

return item.docFilePath;

}


return `${BASE_URL}/view-pdf/${item.id}/ENG/${getDocumentFolder(item.updateType)}`;

}




function analyseCBICImpact(
item:CBICItem
){

const text =
`
${item.service ?? ""}
${item.notificationName ?? ""}
${item.updateCategory ?? ""}
`
.toLowerCase();



let service="Indirect Tax";


let impactArea:string[]=[];

let affectedAreas:string[]=[];

let riskLevel="Medium";



if(
/gst|central tax|integrated tax|union territory tax/
.test(text)
){

service="GST";


impactArea=[
"GST Compliance",
"GST Return Filing",
"Input Tax Credit Review"
];


affectedAreas=[
"GSTR-1",
"GSTR-3B",
"ITC Reconciliation"
];


}



else if(
/custom/
.test(text)
){

service="Customs";


impactArea=[
"Import Export Compliance",
"Customs Duty Impact"
];


affectedAreas=[
"Importers",
"Exporters",
"IEC Holders"
];


}



else if(
/excise/
.test(text)
){

service="Central Excise";


impactArea=[
"Excise Duty Compliance"
];


affectedAreas=[
"Manufacturers"
];


}



if(
/rate|duty|amend|tariff|exempt/
.test(text)
){

riskLevel="High";

}



return {


service,

documentType:
item.updateType ?? "Notification",


category:
item.updateCategory ?? "",


impactArea,


affectedAreas,


aiAction:[

"Identify affected taxpayers",

"Analyse compliance impact",

"Check applicability for clients",

"Prepare advisory note if required"

],


riskLevel


};

}




export function parseCBICUpdates(

data:CBICItem[],

options:ParseOptions={}

):NewsItem[]{



const cutoff =
options.maxAgeDays
?
Date.now() -
(options.maxAgeDays * 86400000)
:
null;



const result:NewsItem[]=[];



for(const item of data){



const date =
item.updatedDate
?
new Date(item.updatedDate)
:
null;



if(!date || isNaN(date.getTime())){

continue;

}



if(
cutoff &&
date.getTime()<cutoff
){

continue;

}



const intelligence =
analyseCBICImpact(item);



const link =
getDocumentLink(item);



result.push({



date,


title:

`${intelligence.service} | ${intelligence.documentType} | ${
item.notificationNo ?? ""
} - ${
item.notificationName ?? ""
}`,



html:`

<h2>CBIC Regulatory Update</h2>

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
<b>Date:</b>
${date.toDateString()}
</p>


<p>
<b>Risk Level:</b>
${intelligence.riskLevel}
</p>


<hr>


<h3>Description</h3>

<p>
${item.notificationName ?? ""}
</p>


<h3>Tax Impact Analysis</h3>

<ul>

${
intelligence.impactArea
.map(
x=>`<li>${x}</li>`
)
.join("")
}

</ul>



<h3>Affected Areas</h3>

<ul>

${
intelligence.affectedAreas
.map(
x=>`<li>${x}</li>`
)
.join("")
}

</ul>



<h3>CA Intelligence Recommended Actions</h3>

<ul>

${
intelligence.aiAction
.map(
x=>`<li>${x}</li>`
)
.join("")
}

</ul>


<p>

<a href="${link}" target="_blank">

Open Original CBIC Document

</a>

</p>


`,


link,


id:
`${BASE_URL}/notification/${item.id}`,



...intelligence


});


}



return result.sort(
(a,b)=>
b.date.getTime()
-
a.date.getTime()
);


}