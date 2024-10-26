import express from 'express';
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

const router = express.Router();

router.get('/', (req, res) => {
    // TODO
    res.send('Get all users');
});

router.get('/me', async (req, res) => {
  try {
    const email = req.user;
    if (!email) {
      res.status(400).json({ error: "Missing required parameter: email" });
      return;
    }
      
    const result = await db.query(
      `
      SELECT * from users WHERE email = ($1)
      `,
      [email]
    );
    if(result.rows.length > 0) {
      const firstname = result.rows[0].firstname;
      const lastname = result.rows[0].lastname;
      res.status(200).json({ success: true, data: {email, firstname, lastname} });
      return;
    } else {
      res.status(401).json({ error: "Invalid username"});
    }
      
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ error: "Internal server error"});
  }
});

router.put('/me', async (req, res) => {
  try {
    const email = req.user;
    console.log(req.body);
    const { firstname, lastname } = req.body;
    if (!email) {
      res.status(400).json({ error: "Missing required parameter: email" });
      return;
    }
    if (!firstname) {
      res.status(400).json({ error: "Missing required parameter: firstname" });
      return;
    }
    if (!lastname) {
      res.status(400).json({ error: "Missing required parameter: lastname" });
      return;
    }
      
    const result = await db.query(
      `
      UPDATE users set firstname=($1), lastname=($2) WHERE email = ($3)
      `,
      [firstname, lastname, email]
    );
    res.status(201).json({ success: true});
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ error: "Internal server error"});
  }
});

export default router;