import express from "express";
import { addShow, getNowPlayingMovies, getShow, getShows } from "../contollers/showController.js";
import { ProtectAdmin } from "../middleware/auth.js";

const showRouter=express.Router();

showRouter.get('/now-playing',ProtectAdmin,  getNowPlayingMovies)
showRouter.post('/add',ProtectAdmin, addShow)
showRouter.get('/all',getShows)
showRouter.get('/:movieId',getShow)

export default showRouter