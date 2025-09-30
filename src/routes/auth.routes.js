import { signUp, signIn, signOut } from "#controllers/auth.controller.js";
import express from "express";

const authRoute = express.Router();

authRoute.post("/sign-up", signUp);
authRoute.post("/sign-in", signIn);
authRoute.post("/sign-out", signOut);

export default authRoute;
