import dotenv from "dotenv";
import express from 'express';
import cors from "cors";
import userRoutes from './routes/user';
import openAIRoutes from './routes/openai';

dotenv.config();
if (!process.env.DATABASE_URL) {
  throw new Error("Required environment variable is missing: DATABASE_URL");
}

const PORT = process.env.PORT || 80;
// const UI_URL = process.env.UI_URL || "http://localhost";
// const UI_PORT = process.env.UI_PORT || 5173;

const app = express();
app.use(express.json());
app.use('/api/user', userRoutes);
app.use('/api/openai', openAIRoutes);

const options = {
  // origin: `${UI_URL}:${UI_PORT}`,
  origin: "*"
  }
app.use(cors(options))

app.get('/api', (req, res) => {
  res.send('Api server is running');
});

app.listen(PORT, () => {
  return console.log(`Express is listening at ${PORT}`);
});