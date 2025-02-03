import express from 'express';
import dotenv from "dotenv";
import OpenAI from 'openai';

dotenv.config();

const DEEPSEEK_URL = process.env.DEEPSEEK_URL || "https://api.deepseek.com";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Initialize the OpenAI client
const client = new OpenAI({
  baseURL: DEEPSEEK_URL,
  apiKey: DEEPSEEK_API_KEY
});

const router = express.Router();

router.get('/generate', async (req, res) => {
  try {
    // TODO - message content is hardcoded for testing
    // it should be retrieved from user request and pass it to deepseek 
    const completion = await client.chat.completions.create({
        model: "deepseek-reasoner", // "deepseek-chat"
        messages: [
            {"role": "user", "content": "write a haiku about ai"}
        ],
        // messages: [{ role: "system", content: "You are a helpful assistant." }],
        // max_tokens: 150
    });
    console.log(completion.choices[0].message);
    res.json({ data: completion.choices[0].message });

    console.log(completion.choices[0].message.content);

  } catch (error) {
    console.error('Error:', error);
  }
});

export default router;