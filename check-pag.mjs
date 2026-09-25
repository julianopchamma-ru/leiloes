const b='https://www.leilaodefazenda.com.br/encontre-seu-imovel?ordem=dt_insert_d';
async function g(p){
  const u=p==1?b:b+'&pag='+p;
  const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0'}});
  const t=await r.text();
  const re = new RegExp('item_id:\\s*"([0-9]+)"','g');
  let m; const ids=[];
  while((m=re.exec(t))!==null) ids.push(m[1]);
  const uniq=[...new Set(ids)];
  console.log('pag',p,'matches',ids.length,'uniq',uniq.length,'sample',uniq.slice(0,3).join(','));
}
await g(51); await g(52); await g(60); await g(97);
