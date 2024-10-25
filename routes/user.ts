import express from 'express';
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import pg from "pg";
import bcrypt from "bcrypt";

dotenv.config();
const db = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
}

const SECRET = process.env.SECRET || "secret string";

const router = express.Router();

router.get('/', (req, res) => {
    // TODO
    res.send('Get all users');
});

router.get('/:id', (req, res) => {
    // TODO
    res.send(`Get user with ID ${req.params.id}`);
});

router.post("/register", async (req, res) => {
    const { email, firstname, lastname, password } = req.body;
    try {
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
      if (!password) {
        res.status(400).json({ error: "Missing required parameter: password" });
        return;
      }
      const passwordHash = await hashPassword(password);
      await db.query(
        `
      INSERT INTO users (email, firstname, lastname, password_hash)
        VALUES ($1, $2, $3, $4)
      `,
        [email, firstname, lastname, passwordHash]
      );
      res.json({ sucess: true });
    } catch (error: any) {
      if (error?.code === "23505") {
        // PostgreSQL unique constraint violation code
        res.status(400).json({ error: "User already exists " + email });
      } else {
        res.status(500).json({ error: "Internal server error "});
      }
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      if (!email) {
        res.status(400).json({ error: "Missing required parameter: email" });
        return;
      }
      if (!password) {
        res.status(400).json({ error: "Missing required parameter: password" });
        return;
      }
      
      const result = await db.query(
        `
      SELECT * from users WHERE email = ($1)
      `,
        [email]
      );
      if(result.rows.length > 0) {
        const dbPasswordHash = result.rows[0].password_hash;
        await bcrypt.compare(password, dbPasswordHash, (err, result) => {
          if (result) {
              // Passwords match, authentication successful
              // create jwt token
              const payload = {
                email: email
              }
              const options = {expiresIn: '10h'};
              const token = jwt.sign(payload, SECRET, options);
              res.status(200).json({ success: true, token: token });
              return;
          } else {
            res.status(401).json({ error: "Invalid username or password"});
          }
        });
      } else {
        res.status(401).json({ error: "Invalid username or password"});
      }
      
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ error: "Internal server error"});
    }
});

export default router;