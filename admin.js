const admin=require("firebase-admin")
const serviceAccount=require("./serviceAccountKey.json")
admin.initializeApp({
    credential:admin.credential.cert(serviceAccount),
    serviceAccountId:"firebase-adminsdk-zqlny@serr-45961.iam.gserviceaccount.com"
})
module.exports=admin;