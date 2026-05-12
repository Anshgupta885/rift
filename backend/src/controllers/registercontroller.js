const user=require('../models/usermodel').default;
const bcrypt=require('bcrypt');

async function register(req,res){
    try {
        const {name,email,password,role} = req.body;
        if(!name || !email || !password){
            return res.status(400).json({message:'Please fill all the fields'});
        }
        const userExists=await user.findOne({email});
        if(userExists){
            return res.status(400).json({message:'User already exists'});
        }
        const allowedRoles = ['user','admin'];
        const assignedRole = allowedRoles.includes(role) ? role : 'user';

        const newUser=await user.create({
            name,
            email,
            password: await bcrypt.hash(password, 10),
            role: assignedRole
        });

        if(newUser){
            return res.status(201).json({
                _id:newUser._id,
                name:newUser.name,
                email:newUser.email,
                role:newUser.role,
            });
        }else{
            return res.status(400).json({message:'Invalid user data'});
        }
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({message:'Failed to register user'});
    }
}

module.exports={register};