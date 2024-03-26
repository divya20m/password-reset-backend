import express from "express"
import { MongoClient } from "mongodb"
import {usersRouter} from "./routes/user.js"
import 'dotenv/config'
import cors from "cors"


export const app= express()
const port=9000

app.use(cors());

const mongourl=process.env.mongourl


async function CreateConnection(){
    const Client=new MongoClient(mongourl)
   await Client.connect()
    console.log("mongodb is connected")
    return Client
}
export const Client=await CreateConnection()


app.get('/',(req,res)=>{
    res.send('myself divya divya has started a port')
})

app.use("/users",usersRouter)

app.listen(port,()=>console.log("the server has started on the",port))


