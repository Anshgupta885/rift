const user=require('../models/usermodel').default;
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const dotenv=require('dotenv');
dotenv.config();

async function login(req,res){
    try {
        const {email,password}=req.body;
        if(!email || !password){
            return res.status(400).json({message:'Please fill all the fields'});
        }
        const userExists=await user.findOne({email});
        if(!userExists){
            return res.status(400).json({message:'Invalid email or password'});
        }
        const isMatch=await bcrypt.compare(password,userExists.password);
        if(!isMatch){
            return res.status(400).json({message:'Invalid email or password'});
        }
        const token=jwt.sign({_id:userExists._id},process.env.JWT_SECRET,{expiresIn:'1h'});
        return res.status(200).json({
            _id:userExists._id,
            name:userExists.name,
            email:userExists.email,
            role:userExists.role,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({message:'Failed to log in'});
    }
}

async function logout(req,res){
   
    return res.status(200).json({message:'Logged out successfully'});
}

module.exports={login,logout};
