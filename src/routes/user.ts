import express from "express"
import { PrismaClient } from "@prisma/client"
import { UserSchema, SignInSchema } from "../zod";
import bcrypt from "bcryptjs"
import { sign } from "jsonwebtoken";

const userRouter = express();
const prisma = new PrismaClient();


userRouter.post('/signup', async (req, res)=>{
    try{
        const {success} = UserSchema.safeParse(req.body);
        if(!success){
            return res.status(411).json({
                msg: "invalid Input"
            })
        }

        const existingUser = await  prisma.user.findFirst({
            where: {
                email: req.body
            }
        })
        if(existingUser){
            return res.status(400).json({
                msg: "User already exist"
            })
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const user = await prisma.user.create({
            data:{
                name: req.body,
                email: req.body,
                password: hashedPassword
            }
        })

        const token = await sign({id: user.id}, req.body.env.JWT_SECRET)

        return res.status(200).json({
            msg: "User is created",
            jwt: token
        })
    } catch(e){
        console.error(e);
        return res.status(411).json({
            msg: "Error..."
        })
    }
});


userRouter.post('/signin', async (req, res)=>{
  const success = SignInSchema.safeParse(req.body);
  if(!success){
    return res.status(411).json({
        msg: "Invalid Credentials"
    })
  }
  const user = await prisma.user.findFirst({
    where: {
        email: req.body
    }
  })
  if(!user){
    return res.status(411).json({
        msg: "Wrong Credentials"
    })
  }
  const validPassword = await bcrypt.compare(req.body.password, user.password)
  if (!validPassword) {
    return res.status(403).json({
        msg: "Incorrect password"
    })
  }
  const token = await sign({id: user.id}, req.body.env.JWT_SECRET)
  return res.status(200).json({
    msg: "login success",
    jwt: token
  })

})