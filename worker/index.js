const KEY = "site_data";
const json = (value, status=200) => Response.json(value,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
export default {
  async fetch(request,env){
    const path=new URL(request.url).pathname;
    if(path!=="/api/data"){
      if(path.startsWith("/api/"))return json({error:"Not found"},404);
      return env.ASSETS.fetch(request);
    }
    if(request.method==="GET"){
      const data=await env.MY_KV.get(KEY,"json");
      if(data && typeof data==="object")delete data.devCode;
      return json(data??{});
    }
    if(request.method!=="POST")return new Response("Method Not Allowed",{status:405,headers:{Allow:"GET, POST"}});
    const token=request.headers.get("Authorization")||"";
    if(!env.API_WRITE_TOKEN || token!==`Bearer ${env.API_WRITE_TOKEN}`)return json({error:"Unauthorized"},401);
    if(!(request.headers.get("Content-Type")||"").toLowerCase().startsWith("application/json"))return json({error:"Expected JSON"},415);
    const raw=await request.text();
    if(new TextEncoder().encode(raw).length>65536)return json({error:"Too large"},413);
    let data;
    try{data=JSON.parse(raw);}catch{return json({error:"Invalid JSON"},400);}
    if(!data || typeof data!=="object" || !Array.isArray(data.links))return json({error:"Invalid sitemap data"},400);
    delete data.devCode;
    delete data.lastRemoteSignature;
    delete data.lastRemoteUpdatedAt;
    await env.MY_KV.put(KEY,JSON.stringify(data));
    return json({ok:true});
  }
};
