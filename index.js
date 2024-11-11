import express from 'express';
import cors from 'cors';
import 'dotenv/config.js';
import routes from './src/router/index.js';

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cors())
app.use(routes)



app.listen(PORT, () => console.log(`Server is listening on Port ${PORT}`));
