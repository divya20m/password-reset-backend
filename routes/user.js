import express from "express";
import {genPassword,createUser,getUsersByEmail,getAllUsers,forgotPassword,resetPassword,DeleteUsersByEmail} from "../function.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import nodemailer from 'nodemailer';
import 'dotenv/config'

const router=express.Router()

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const transporter = nodemailer.createTransport({
  service: 'gmail',

  auth: {
    user: process.env.email,
    pass: process.env.passwordemail
  },
});



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
      return res.status(400).json({ error: "Email already exists" });
    } else {
      const hashedPassword = await genPassword(password);
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


//forgot password link
router.post("/forgot-password", express.json(), async (req, res) => {
  const { email } = req.body;
  try {
    const user = await getUsersByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }

    const secret = process.env.secretkey;
    const token = jwt.sign({ email: user.email }, secret, { expiresIn: '1h' });
    const resetLink = `https://password-reset-frontend-eosin.vercel.app/reset-password/${email}/${token}`;
    
    //  email message
    const mailOptions = {
      from: process.env.email,
      to: email,
      subject: 'Reset Password',
      text: `Click the following link to reset your password: ${resetLink}`
    };
    
    // Send the email
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to send reset email" });
      } else {
        console.log('Email sent: ' + info.response);
        return res.json({ message: "Reset email sent successfully", resetLink });
      }
    });
  } catch (error) {
    console.error("Error generating reset link:", error);
    return res.status(500).json({ error: "Failed to generate reset link" });
  }
});






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




// router.post("/forgot-password", express.json(), async (req, res) => {
//     const { email } = req.body;
//     try {
//       const user = await getUsersByEmail(email);
//       if (!user) {
//         return res.status(404).json({ error: "User Not Found" });
//       }
      
//       const secret = process.env.secretkey;
//       const token = jwt.sign({ email: user.email }, secret, { expiresIn: '1h' });
//       const resetLink = `https://password-reset-bgme.onrender.com/users/reset-password/${email}/${token}`;
//       return res.json({ message: "Reset link generated successfully.Reset link generated successfully,kindly check the console and click the link which directs you to change your passwords" , resetLink});
  
//     } catch (error) {
//       console.error("Error generating reset link:", error);
//       return res.status(500).json({ error: "Failed to generate reset link" });
//     }
//   });
  





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


//get the reset password using the link
router.get("/reset-password/:email/:token",express.json(), async (req, res) => {
  const { email, token } = req.params;

  const oldUser = await getUsersByEmail(email)
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" });
  }
  try {
    const result=oldUser
    res.redirect(`https://password-reset-frontend-eosin.vercel.app/reset-password/${email}/${token}`);

  } catch (error) {
    console.log(error);
    res.json({ status: "Something Went Wrong" });
  }
});

//get userdata
router.post("/userData", express.json(), async (req, res) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, process.env.secretkey, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    console.log(user);
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }

    const useremail =  getUsersByEmail(email)
      .then((data) => {
        res.send({ status: "ok", data: data });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      });
  } catch (error) { }
});

  
  
  
export const usersRouter=router






router.post("/forgot-password", express.json(), async (req, res) => {
  const { email } = req.body;
  try {
      const user = await getUsersByEmail(email);
      if (!user) {
          return res.status(404).json({ error: "User Not Found" });
      }
    
      const secret = process.env.secretkey;
      const token = jwt.sign({ email: user.email }, secret, { expiresIn: '1h' });
      const resetLink = `https://password-reset-frontend-eosin.vercel.app/reset-password/${email}/${token}`;
      const message = "Kindly check the console for the link. You will be redirected to the reset password page.";
      
      // You can log the reset link and message in the console
      console.log("Reset Link:", resetLink);
      console.log("Message:", message);
      
      return res.json({ message, resetLink });
  } catch (error) {
      console.error("Error generating reset link:", error);
      return res.status(500).json({ error: "Failed to generate reset link" });
  }
});





