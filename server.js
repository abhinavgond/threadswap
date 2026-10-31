require('dotenv').config();
const express=require('express'),mongoose=require('mongoose'),bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken'),helmet=require('helmet'),rate=require('express-rate-limit');
const {User,Item,Swap,Msg}=require('./models'),{CITY,COND,BASE,calc,km}=require('./util');
if(!process.env.JWT_SECRET||!process.env.MONGO_URI){console.error('Set MONGO_URI and JWT_SECRET in .env');process.exit(1)}
const app=express();app.set('trust proxy',1);
app.use(helmet({contentSecurityPolicy:false}),express.json({limit:'1mb'}),express.static('public'));
const bad=(msg,code=400)=>{throw{msg,code}};
const W=f=>(q,s,n)=>Promise.resolve(f(q,s,n)).catch(e=>{if(!e.msg)console.error(e);s.status(e.code||500).json({error:e.msg||'Server error'})});
const sign=u=>jwt.sign({id:u._id,role:u.role},process.env.JWT_SECRET,{expiresIn:'7d'});
const auth=W((q,s,n)=>{try{q.u=jwt.verify((q.headers.authorization||'').slice(7),process.env.JWT_SECRET)}catch{bad('Please log in',401)}n()});
const admin=(q,s,n)=>q.u.role==='admin'?n():s.status(403).json({error:'Admins only'});
const pub=u=>({id:u._id,name:u.name,email:u.email,city:u.city,phone:u.phone,role:u.role});
const esc=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const str=(v,max,min=1)=>{v=String(v??'').trim();if(v.length<min||v.length>max)bad(`Invalid text (${min}-${max} characters)`);return v};
const sys=(swap,text)=>Msg.create({swap,text,sys:true});

/* Auth */
const lim=rate({windowMs:15*60*1000,limit:60,message:{error:'Too many attempts. Try again later.'}});
app.post('/api/auth/register',lim,W(async(q,s)=>{const b=q.body,pw=String(b.pw||'');
 if(!/^\S+@\S+\.\S+$/.test(b.email||''))bad('Enter a valid email');if(pw.length<8||!/[A-Za-z]/.test(pw)||!/\d/.test(pw))bad('Password needs 8+ characters with letters and numbers');
 if(!CITY[b.city])bad('Choose a city');if(!/^\d{10}$/.test(b.phone||''))bad('Phone must be 10 digits');
 if(await User.findOne({email:String(b.email).toLowerCase()}))bad('That email is already registered');
 const u=await User.create({name:str(b.name,40,2),email:b.email,pw:await bcrypt.hash(pw,10),city:b.city,phone:b.phone});s.json({token:sign(u),user:pub(u)})}));
app.post('/api/auth/login',lim,W(async(q,s)=>{const u=await User.findOne({email:String(q.body.email||'').toLowerCase()});
 if(!u||!await bcrypt.compare(String(q.body.pw||''),u.pw))bad('Email or password is wrong',401);s.json({token:sign(u),user:pub(u)})}));
app.get('/api/me',auth,W(async(q,s)=>{const u=await User.findById(q.u.id);if(!u)bad('Please log in',401);s.json(pub(u))}));
app.put('/api/me',auth,W(async(q,s)=>{const b=q.body;if(!CITY[b.city])bad('Choose a city');if(!/^\d{10}$/.test(b.phone||''))bad('Phone must be 10 digits');
 s.json(pub(await User.findByIdAndUpdate(q.u.id,{name:str(b.name,40,2),city:b.city,phone:b.phone},{new:true})))}));

/* Items, value calculator, location matching */
app.get('/api/value',W((q,s)=>s.json({val:BASE[q.query.cat]&&COND[q.query.cond]?calc(q.query.cat,q.query.brand,q.query.cond):0})));
app.get('/api/items',W(async(q,s)=>{const{q:t,cat,city,radius,home}=q.query,f={status:'available'};if(cat)f.cat=cat;if(city)f.city=city;
 if(t)f.$or=['title','brand','cat'].map(k=>({[k]:new RegExp(esc(t).slice(0,40),'i')}));
 let a=(await Item.find(f).lean()).map(i=>({...i,km:km(home,i.city)}));if(+radius)a=a.filter(i=>i.km<=+radius);s.json(a.sort((x,y)=>x.km-y.km))}));
app.get('/api/items/:id',W(async(q,s)=>{const i=await Item.findById(q.params.id).populate('owner','name city').lean();if(!i||i.status==='removed')bad('Item not found',404);s.json(i)}));
app.get('/api/my/items',auth,W(async(q,s)=>s.json(await Item.find({owner:q.u.id,status:{$ne:'removed'}}).sort('-createdAt'))));
const itemBody=b=>{if(!BASE[b.cat]||!COND[b.cond]||!CITY[b.city])bad('Choose category, condition and city');const val=+b.val;if(!(val>=50&&val<=50000))bad('Swap value must be between ₹50 and ₹50,000');
 if(b.img&&(!/^data:image\//.test(b.img)||b.img.length>400000))bad('Photo is too large');
 return{title:str(b.title,50),cat:b.cat,brand:str(b.brand,30),size:str(b.size,8),cond:b.cond,city:b.city,val,desc:String(b.desc||'').slice(0,200),img:b.img||null}};
app.post('/api/items',auth,W(async(q,s)=>s.json(await Item.create({...itemBody(q.body),owner:q.u.id}))));
app.put('/api/items/:id',auth,W(async(q,s)=>{const i=await Item.findOne({_id:q.params.id,owner:q.u.id,status:{$in:['available','paused']}});if(!i)bad('Item not found',404);
 if(q.body.toggle)i.status=i.status==='paused'?'available':'paused';else Object.assign(i,itemBody(q.body));s.json(await i.save())}));
const dropItem=async id=>{await Item.findByIdAndUpdate(id,{status:'removed'});
 for(const w of await Swap.find({status:{$in:['pending','accepted']},$or:[{fromItem:id},{toItem:id}]})){w.status='cancelled';await w.save();await sys(w._id,'Request cancelled because an item was removed.')}};
app.delete('/api/items/:id',auth,W(async(q,s)=>{if(!await Item.findOne({_id:q.params.id,owner:q.u.id}))bad('Item not found',404);await dropItem(q.params.id);s.json({ok:1})}));

/* Swaps */
const pop=x=>x.populate('fromItem toItem','title val img city cat brand').populate('from to','name city');
const mine=async(q,id)=>{const w=await Swap.findById(id);if(!w)bad('Swap not found',404);const p=[w.from,w.to].some(x=>x.equals(q.u.id));if(!p&&q.u.role!=='admin')bad('Not your swap',403);return{w,p}};
app.post('/api/swaps',auth,W(async(q,s)=>{const[a,b]=await Promise.all([Item.findById(q.body.fromItem),Item.findById(q.body.toItem)]);
 if(!a||!b||!a.owner.equals(q.u.id)||b.owner.equals(q.u.id)||a.status!=='available'||b.status!=='available')bad('These items cannot be swapped');
 if(await Swap.findOne({fromItem:a._id,toItem:b._id,status:{$in:['pending','accepted']}}))bad('You already sent this request');
 const w=await Swap.create({from:q.u.id,to:b.owner,fromItem:a._id,toItem:b._id});await Msg.create({swap:w._id,from:q.u.id,text:str(q.body.text||'Hi! Would you like to swap?',400)});s.json(w)}));
app.get('/api/swaps',auth,W(async(q,s)=>s.json(await pop(Swap.find({$or:[{from:q.u.id},{to:q.u.id}]}).sort('-createdAt')))));
app.get('/api/swaps/:id',auth,W(async(q,s)=>{await mine(q,q.params.id);s.json({swap:await pop(Swap.findById(q.params.id)),msgs:await Msg.find({swap:q.params.id}).populate('from','name').sort('createdAt')})}));
app.post('/api/swaps/:id/messages',auth,W(async(q,s)=>{const{w,p}=await mine(q,q.params.id);if(!p||!['pending','accepted'].includes(w.status))bad('Chat is closed');s.json(await Msg.create({swap:w._id,from:q.u.id,text:str(q.body.text,500)}))}));
app.post('/api/swaps/:id/respond',auth,W(async(q,s)=>{const{w}=await mine(q,q.params.id);if(!w.to.equals(q.u.id)||w.status!=='pending')bad('Not allowed');
 w.status=q.body.ok?'accepted':'rejected';await w.save();await sys(w._id,`Request ${w.status}.`);s.json(w)}));
app.post('/api/swaps/:id/cancel',auth,W(async(q,s)=>{const{w}=await mine(q,q.params.id);if(!w.from.equals(q.u.id)||w.status!=='pending')bad('Not allowed');w.status='cancelled';await w.save();await sys(w._id,'Request cancelled.');s.json(w)}));
app.post('/api/swaps/:id/confirm',auth,W(async(q,s)=>{const{w,p}=await mine(q,q.params.id);if(!p||w.status!=='accepted')bad('Not allowed');
 if(!w.conf.some(x=>x.equals(q.u.id)))w.conf.push(q.u.id);
 if(w.conf.length>=2){w.status='completed';await Item.updateMany({_id:{$in:[w.fromItem,w.toItem]}},{status:'swapped'});
  await Swap.updateMany({_id:{$ne:w._id},status:{$in:['pending','accepted']},$or:[{fromItem:{$in:[w.fromItem,w.toItem]}},{toItem:{$in:[w.fromItem,w.toItem]}}]},{status:'cancelled'});await sys(w._id,'Swap complete.')}
 else await sys(w._id,'One member confirmed the swap.');await w.save();s.json(w)}));
app.post('/api/swaps/:id/dispute',auth,W(async(q,s)=>{const{w,p}=await mine(q,q.params.id);if(!p)bad('Not allowed',403);w.dispute={by:q.u.id,reason:str(q.body.reason,300,5),resolved:false};await w.save();await sys(w._id,'A dispute was sent to the admin team.');s.json(w)}));

/* Admin */
app.get('/api/admin/stats',auth,admin,W(async(q,s)=>{const[users,listings,swaps,done,acc,openD,byCat]=await Promise.all([User.countDocuments({role:'user'}),Item.countDocuments({status:{$ne:'removed'}}),Swap.countDocuments(),Swap.countDocuments({status:'completed'}),Swap.countDocuments({status:{$in:['accepted','completed']}}),Swap.countDocuments({'dispute.resolved':false}),Item.aggregate([{$match:{status:{$ne:'removed'}}},{$group:{_id:'$cat',n:{$sum:1}}}])]);
 const active=new Set([...(await Item.distinct('owner',{status:{$ne:'removed'}})),...(await Swap.distinct('from')),...(await Swap.distinct('to'))].map(String)).size;
 s.json({users,listings,swaps,completed:done,activeUsers:active,conversion:swaps?Math.round(acc/swaps*100):0,engagement:users?Math.round(active/users*100):0,openDisputes:openD,byCat})}));
app.get('/api/admin/users',auth,admin,W(async(q,s)=>s.json(await User.find({role:'user'}).select('-pw'))));
app.delete('/api/admin/users/:id',auth,admin,W(async(q,s)=>{for(const i of await Item.find({owner:q.params.id}))await dropItem(i._id);await User.deleteOne({_id:q.params.id,role:'user'});s.json({ok:1})}));
app.get('/api/admin/items',auth,admin,W(async(q,s)=>s.json(await Item.find({status:{$ne:'removed'}}).populate('owner','name'))));
app.delete('/api/admin/items/:id',auth,admin,W(async(q,s)=>{await dropItem(q.params.id);s.json({ok:1})}));
app.get('/api/admin/swaps',auth,admin,W(async(q,s)=>s.json(await pop(Swap.find().sort('-createdAt')))));
app.post('/api/admin/swaps/:id/resolve',auth,admin,W(async(q,s)=>{const w=await Swap.findById(q.params.id);if(!w||!w.dispute)bad('No dispute',404);w.dispute.resolved=true;if(q.body.cancel&&['pending','accepted'].includes(w.status))w.status='cancelled';await w.save();await sys(w._id,'Admin resolved the dispute.');s.json(w)}));
app.use('/api',(q,s)=>s.status(404).json({error:'Not found'}));

mongoose.connect(process.env.MONGO_URI).then(()=>app.listen(process.env.PORT||3000,()=>console.log('ThreadSwap running on port '+(process.env.PORT||3000)))).catch(e=>{console.error('MongoDB connection failed:',e.message);process.exit(1)});
