import express from 'express';
import dotenv from "dotenv";
import axios from 'axios';

dotenv.config();

const OPENAI_URL = process.env.OPENAI_URL || "https://api.openai.com/v1/";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_ORGANIZATION = process.env.OPENAI_ORGANIZATION;
const OPENAI_PROJECT = process.env.OPENAI_PROJECT;


const router = express.Router();

router.get('/models', (req, res) => {
    axios.get(`${OPENAI_URL}models`, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Organization': OPENAI_ORGANIZATION,
          'OpenAI-Project': OPENAI_PROJECT
        }
      }).then((result) => {
        // console.log(result);
        res.json({ data: result.data.data });
      }).catch((err) => console.log(err));
});

export default router;