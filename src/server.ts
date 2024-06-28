import express from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import bodyParser from "body-parser"
import cors from "cors"

const app = express();
app.use(cors())
app.use(bodyParser.json())

