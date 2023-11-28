import express from "express";
import {genPassword,createUser,getUsersByEmail,getAllUsers,forgotPassword,resetPassword,DeleteUsersByEmail} from "../function.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import nodemailer from 'nodemailer';

const router=express.Router()


//get all users
router.get("/",async (req, res)=>{
    const result=await getAllUsers()
    res.send(result)
})

//delete all users using email
router.delete("/:email",async (req, res)=>{
    const{email}=req.params
    const result=await DeleteUsersByEmail(email)
    res.send(result)
})


//signing up 
router.post("/signup", express.json(), async (req, res) => {
    const { email, password } = req.body;
  
    const isUserExist = await getUsersByEmail(email);
  
    if (isUserExist) {
      // If the user already exists, send a 400 status with a custom error message
      return res.status(400).json({ error: "Email already exists" });
    } else {
      const hashedPassword = await genPassword(email);
      const result = await createUser(email, hashedPassword);
      return res.status(201).json({ message: "User signed up successfully", result });
    }
  });


//loging in
router.post("/login", express.json(), async (req, res) => {
    const {email,password} = req.body
const userFromDb =await getUsersByEmail(email)
if(!userFromDb){
    res.status(400).send({message:"Invalid EmailID"})
return 
}
const storedDbPassword = userFromDb.password
const isPasswordMatch=await bcrypt.compare(password,storedDbPassword)
if(!isPasswordMatch){
    res.status(400).send({message:"Invalid Password"})
return 
}
const token = jwt.sign({id:userFromDb._id},process.env.secretkey)
res.send({message:"Login Successful", token:token})
})



//forgot password
// router.post("/forgot-password", express.json(), async (req, res) => {
//     const { email } = req.body;
//     try {
//       const user = await getUsersByEmail(email);
//       if (!user) {
//         return res.status(404).json({ error: "User Not Found" });
//       }
//       const secret = process.env.secretkey;
//       const token = jwt.sign({ email: user.email }, secret);
//       const resetLink = `http://localhost:9000/reset-password/${token}`;
//       return res.json({ message: "Reset link sent successfully", resetLink });
//     } catch (error) {
//       console.error("Error sending reset link:", error);
//       return res.status(500).json({ error: "Failed to send reset link" });
//     }
//   });

router.post("/forgot-password", express.json(), async (req, res) => {
    const { email } = req.body;
    try {
      const user = await getUsersByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User Not Found" });
      }
      
      const secret = process.env.secretkey;
      const token = jwt.sign({ email: user.email }, secret, { expiresIn: '1h' });
      const resetLink = `http://localhost:9000/reset-password/${token}`;
      return res.json({ message: "Reset link generated successfully", resetLink ,token});
  
    } catch (error) {
      console.error("Error generating reset link:", error);
      return res.status(500).json({ error: "Failed to generate reset link" });
    }
  });
  





//get users by email id
router.get("/reset-password/:email", express.json(), async (req, res) => {
    const { email } = req.params;
    const oldUser = await getUsersByEmail(email)
  
    if (!oldUser) {
      return res.status(404).send({ status: "User Not Exists!!" });
    }
  
    return res.send(oldUser);
  });
  

  //reset password
  router.post("/reset-password/:email/:token",express.json(), async (req, res) => {
    const { email, token } = req.params;
    const { password } = req.body;
  
    const oldUser = await getUsersByEmail(email)
    if (!oldUser) {
      return res.json({ status: "User Not Exists!!" });
    }
    const secret = process.env.secretkey
    try {
      const verify = jwt.verify(token, secret);
      const encryptedPassword = await bcrypt.hash(password, 10);
      const updateuser = await resetPassword(encryptedPassword, email)
      res.json({ email: verify.email, status: "verified", message:"Password Successfully Changed" });
    } catch (error) {
      console.log(error);
      res.json({ status: "Something Went Wrong" });
    }
});

//get reset page
router.get("/reset-password/:token", express.json(), async (req, res) => {
  const { token } = req.params;

  try {
    const secret = process.env.secretkey;
    const decoded = jwt.verify(token, secret);

    // Assuming the email is nested under 'user' property in the decoded token
    const email = decoded.user.email;

    const oldUser = await getUsersByEmail(email);
    if (!oldUser) {
      return res.status(404).json({ status: "User Not Found" });
    }

    res.json({ email, status: "verified", message: "Token is valid" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "Invalid or Expired Token" });
  }
});

  
  
  
export const usersRouter=router

