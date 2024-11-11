import { Router } from "express";
import botService from "../service/botService.js";

const routes = Router()

routes.post('/add-movies',botService.postMovies)

export default routes