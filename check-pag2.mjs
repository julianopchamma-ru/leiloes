const b='https://www.leilaodefazenda.com.br/encontre-seu-imovel?ordem=dt_insert_d';
async function g(p){
  const u=b+'&pag='+p;
  const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0'}});
  const t=await r.text();
  console.log('pag',p,'len',t.length,'has pagination',t.includes('pagination'),'has imovel',t.includes('/imovel/'));
  const idx=t.indexOf('pagination');
  if(idx>0) console.log(t.slice(idx, idx+800));
}
await g(50); await g(51); await g(97);
