(function(root){
const date=s=>new Date(s+'T00:00:00Z'),iso=d=>d.toISOString().slice(0,10);
function bucket(s,grain){const d=date(s);if(grain==='month')d.setUTCDate(1);if(grain==='week')d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return iso(d);}
function analytics(data,f={}){
 const dates=data.orders.map(o=>o.order_date).sort(),min=dates[0],max=dates.at(-1),start=f.start||min,end=f.end||max;
 if(!start||!end||start>end)return {series:[],categories:[],customers:[],units:0,value:0,orders:0,customersCount:0};
 const products=new Map(data.products.filter(p=>(!f.category||p.category_id===f.category)&&(!f.supplier||p.supplier_id===f.supplier)&&(!f.product||p.product_id===f.product)&&(!f.discontinued||String(p.discontinued).toLowerCase()===f.discontinued)).map(p=>[p.product_id,p]));
 const orders=new Map(data.orders.filter(o=>o.status==='shipped'&&o.order_date>=start&&o.order_date<=end).map(o=>[o.order_id,o]));
 const customers=new Map((data.customers||[]).map(c=>[c.customer_id,c.first_name+' '+c.last_name]));const catNames=new Map(data.categories.map(c=>[c.category_id,c.category_name]));
 const grain=f.grain||'month',series=new Map(),cats=new Map(),clients=new Map(),orderSet=new Set();
 const d=date(bucket(start,grain)),last=bucket(end,grain);
 for(let guard=0;iso(d)<=last&&guard<40000;guard++){const key=iso(d);series.set(key,{date:key,units:0,cents:0,ids:new Set()});if(grain==='month')d.setUTCMonth(d.getUTCMonth()+1);else d.setUTCDate(d.getUTCDate()+(grain==='week'?7:1));}
 let units=0,cents=0;
 for(const i of data.order_items){const p=products.get(i.product_id),o=orders.get(i.order_id);if(!p||!o)continue;const q=Number(i.quantity),amount=Math.round(Number(i.unit_price)*100)*q;units+=q;cents+=amount;orderSet.add(o.order_id);
 const point=series.get(bucket(o.order_date,grain));if(point){point.units+=q;point.cents+=amount;point.ids.add(o.order_id);}
 const c=cats.get(p.category_id)||{id:p.category_id,name:catNames.get(p.category_id),units:0,cents:0};c.units+=q;c.cents+=amount;cats.set(p.category_id,c);
 const customer=clients.get(o.customer_id)||{id:o.customer_id,name:customers.get(o.customer_id)||'Cliente '+o.customer_id,units:0,cents:0,ids:new Set()};customer.units+=q;customer.cents+=amount;customer.ids.add(o.order_id);clients.set(o.customer_id,customer);
 }
 return {series:[...series.values()].map(p=>({date:p.date,units:p.units,value:p.cents/100,orders:p.ids.size})),categories:[...cats.values()].map(c=>({...c,value:c.cents/100})),customers:[...clients.values()].map(c=>({id:c.id,name:c.name,units:c.units,value:c.cents/100,orders:c.ids.size})),units,value:cents/100,orders:orderSet.size,customersCount:clients.size,start,end};
}
const api={analytics,bucket};if(typeof module!=='undefined')module.exports=api;else root.GardenAnalytics=api;
})(typeof window!=='undefined'?window:globalThis);
