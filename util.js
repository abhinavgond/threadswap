const CITY={Varanasi:[25.32,82.97],Lucknow:[26.85,80.95],Prayagraj:[25.44,81.85],Delhi:[28.61,77.21],Jaipur:[26.91,75.79],Mumbai:[19.08,72.88],Bengaluru:[12.97,77.59],Kolkata:[22.57,88.36]};
const BASE={Jeans:900,Shirt:600,Top:500,Dress:1100,Jacket:1500,Ethnic:1300,Hoodie:1000,Blazer:1800};
const BRAND={"levi's":1.6,zara:1.5,nike:1.5,adidas:1.5,raymond:1.6,manyavar:1.7,fabindia:1.4,"h&m":1.1,biba:1.3,"allen solly":1.3,w:1.2,"van heusen":1.3};
const COND={'New with tags':1,'Like new':.85,Good:.65,Fair:.45};
exports.CITY=CITY;exports.COND=COND;exports.BASE=BASE;
exports.calc=(c,b,k)=>Math.round(BASE[c]*(BRAND[String(b||'').trim().toLowerCase().replace(/’/g,"'")]||1)*COND[k]/10)*10;
exports.km=(a,b)=>{const[p,q]=CITY[a]||CITY.Varanasi,[r,s]=CITY[b]||CITY.Varanasi,R=Math.PI/180,x=Math.sin((r-p)*R/2)**2+Math.cos(p*R)*Math.cos(r*R)*Math.sin((s-q)*R/2)**2;return Math.round(12742*Math.asin(Math.sqrt(x)))};
