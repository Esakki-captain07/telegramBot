import { Router } from "express";
import botRoutes from './botRouter.js'


const routes = Router()

routes.get('/',(req,res)=>{
    res.status(200).send({
        message:`<div>
                    <h1>BlogApp Backend</h1>
                </div>`
    })
})

routes.use('/movies',botRoutes)

export default routes