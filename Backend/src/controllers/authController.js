import User from "../models/usermodel.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export const register= async(req,res)=>{
    const{name,email,password}=req.body;

    
    if(!email || !password ||!name){
        return res.status(400).json({
            message:"Fields cannot be empty"
        })

    }
   
    try{
    
    const cleanEmail = email.toLowerCase().trim();
    const user= await User.findOne({email:cleanEmail});
    if(user){
        return res.status(400).json({
            message:"Email already registered"
        })
    }

    const hashedPassword = await bcrypt.hash(password,10); 

    const newUser = await User.create({
        name,
        email:cleanEmail,
        password:hashedPassword
    })

    return res.status(201).json({
        message:"user registered successfully",
         user: { id: newUser._id, name: newUser.name, email: newUser.email }
    })

 }catch(error){
   return res.status(500).json({
    message:"error occoured while registering"
   })
 }

    
}

export const login=async(req,res)=>{
    const {email,password}=req.body;
      
     if(!email || !password ){
        return res.status(400).json({
            message:"Fields cannot be empty"
        })

     }

     try{
     const cleanEmail = email.toLowerCase().trim();
     const user= await User.findOne({email:cleanEmail});

     if(!user){
        return res.status(400).json({
            message:"invalid email or password"
        })
     }

     const checkPassword = await bcrypt.compare(password,user.password);

     if(!checkPassword){
        return res.status(400).json({
            message:"invalid email or password"
        })
     }

     const token =jwt.sign(
        {userId:user._id},
        process.env.JWT_SECRET,
        {expiresIn: "7d"}
     );
      
     res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // same 7 days, in ms
     });

     return res.status(200).json({
        message:"Login successful",
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
     })

    }catch(error){
        return res.status(500).json({
         message:"error occured during signIn process"
        })
        
    }

}