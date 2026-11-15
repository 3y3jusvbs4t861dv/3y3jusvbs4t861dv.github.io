const KEY="site_data";
const GITHUB_ORIGIN="https://3y3jusvbs4t861dv.github.io";
const secureHeaders={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
function cors(request){
  const origin=request.headers.get("Origin")||"";
  return origin===GITHUB_ORIGIN?{
    "Access-Control-Allow-Origin":GITHUB_ORIGIN,
    "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":"Authorization, Content-Type",
    "Access-Control-Max-Age":"3600",
    "Vary":"Origin"
  }:{};
}
function json(value,status,request){
  return Response.json(value,{status,headers:{...secureHeaders,...cors(request)}});
}
function isAuthorized(request,env){
  const header=request.headers.get("Authorization")||"";
  return !!env.API_WRITE_TOKEN && header===`Bearer ${env.API_WRITE_TOKEN}`;
}
export default {
  async fetch(request,env){
    const path=new URL(request.url).pathname;
    if(path!=="/api/data" && path!=="/api/auth"){
      if(path.startsWith("/api/"))return json({error:"Not found"},404,request);
      return env.ASSETS.fetch(request);
    }
    if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{...secureHeaders,...cors(request)}});
    if(path==="/api/auth"){
      if(request.method!=="POST")return json({error:"Method Not Allowed"},405,request);
      return isAuthorized(request,env)?json({ok:true},200,request):json({error:"Unauthorized"},401,request);
    }
    if(request.method==="GET"){
      const data=await env.MY_KV.get(KEY,"json");
      if(data && typeof data==="object")delete data.devCode;
      return json(data??{},200,request);
    }
    if(request.method!=="POST")return json({error:"Method Not Allowed"},405,request);
    if(!isAuthorized(request,env))return json({error:"Unauthorized"},401,request);
    if(!(request.headers.get("Content-Type")||"").toLowerCase().startsWith("application/json"))return json({error:"Expected JSON"},415,request);
    const raw=await request.text();
    if(new TextEncoder().encode(raw).length>65536)return json({error:"Too large"},413,request);
    let data;
    try{data=JSON.parse(raw);}catch{return json({error:"Invalid JSON"},400,request);}
    if(!data || typeof data!=="object" || !Array.isArray(data.links))return json({error:"Invalid sitemap data"},400,request);
    delete data.devCode;
    delete data.lastRemoteSignature;
    delete data.lastRemoteUpdatedAt;
    data.updatedAt=Date.now();
    await env.MY_KV.put(KEY,JSON.stringify(data));
    return json({ok:true,updatedAt:data.updatedAt},200,request);
  }
};
