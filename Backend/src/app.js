import express from "express"
import authRoutes from './routes/authRoutes.js'
import cookieParser from 'cookie-parser'
import imageroutes from './routes/imageroutes.js'
import complaintRoutes from './routes/complaintRoutes.js'


const app=express();


app.use(express.json());
app.use(cookieParser());

app.use("/api/auth",authRoutes)
app.use("/api",imageroutes);
app.use("/api/complaints",complaintRoutes)

export default app;