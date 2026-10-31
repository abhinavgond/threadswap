const {Schema,model}=require('mongoose'),oid=Schema.Types.ObjectId;
exports.User=model('User',new Schema({name:String,email:{type:String,unique:true,lowercase:true},pw:String,city:String,phone:String,role:{type:String,default:'user'}},{timestamps:true}));
exports.Item=model('Item',new Schema({owner:{type:oid,ref:'User'},title:String,cat:String,brand:String,size:String,cond:String,city:String,val:Number,desc:String,img:String,status:{type:String,default:'available'}},{timestamps:true}));
exports.Swap=model('Swap',new Schema({from:{type:oid,ref:'User'},to:{type:oid,ref:'User'},fromItem:{type:oid,ref:'Item'},toItem:{type:oid,ref:'Item'},status:{type:String,default:'pending'},conf:[oid],dispute:{by:oid,reason:String,resolved:Boolean}},{timestamps:true}));
exports.Msg=model('Msg',new Schema({swap:{type:oid,ref:'Swap'},from:{type:oid,ref:'User'},text:String,sys:Boolean},{timestamps:true}));
