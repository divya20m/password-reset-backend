import { Client } from "./index.js";
import bcrypt from "bcrypt"

export async function genPassword(password) {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
   return hashedPassword
}

    export async function createUser(email,hashedPassword) {
        return await Client.db("users-login").collection("users-list").insertOne({email:email,password:hashedPassword});
    }

    
    export async function getUsersByEmail(email) {
        return await Client.db("users-login").collection("users-list").findOne({email:email});
    }

     
    export async function getAllUsers() {
        return await Client.db("users-login").collection("users-list").find().toArray()
    }

    export async function forgotPassword(email) {
        return await Client.db("users-login").collection("users-list").findOne({ email })
    }

    export async function getByID(id, token) {
        return await Client.db("users-login").collection("users-list").find({ email })
    }

    export async function resetPassword(encryptedPassword, email) {
        return await Client.db("users-login").collection("users-list").updateOne(
          { email: email },
          { $set: { password: encryptedPassword } }
        );
      }

      export async function DeleteUsersByEmail(email) {
        return await Client.db("users-login").collection("users-list").deleteOne({ email:email })
    }

  