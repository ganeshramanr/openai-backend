import express from 'express';
import dotenv from "dotenv";
import axios from 'axios';
import OpenAI from 'openai';

dotenv.config();

const OPENAI_URL = process.env.OPENAI_URL || "https://api.openai.com/v1";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_ORGANIZATION = process.env.OPENAI_ORGANIZATION;
const OPENAI_PROJECT = process.env.OPENAI_PROJECT;

// Initialize the OpenAI client
const client = new OpenAI({
  baseURL: OPENAI_URL,
  apiKey: OPENAI_API_KEY
});

const router = express.Router();

router.get('/models', (req, res) => {
    axios.get(`${OPENAI_URL}/models`, {
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

router.get('/generate', async (req, res) => {
  try {
    // Define the parameters for the chat completion
    // const params: OpenAI.Chat.ChatCompletionCreateParams = {
    //   messages: [{ role: 'user', content: 'Say this is a test' }],
    //   model: 'davinci-002',
    // };
    // // Create a chat completion
    // const chatCompletion: OpenAI.Chat.ChatCompletion = await client.chat.completions.create(params);
    // console.log(chatCompletion.choices[0].message);
    // res.json({ data: chatCompletion.choices[0].message });


    //////////////////////////////////////
    const completion = await client.chat.completions.create({
        model: "davinci-002",
        messages: [
            {"role": "user", "content": "write a haiku about ai"}
        ],
        // max_tokens: 150
    });
    console.log(completion.choices[0].message);
    res.json({ data: completion.choices[0].message });

  } catch (error) {
    console.error('Error:', error);
  }
});

export default router;