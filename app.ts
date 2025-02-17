import express from 'express';
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import pg from "pg";
import bcrypt from "bcrypt";
import axios from 'axios';
import userRoutes from './routes/user';
import openAIRoutes from './routes/openai';
import deepseekRoutes from './routes/deepseek';

dotenv.config();
if (!process.env.AUTH_DB_URL) {
  throw new Error("Required environment variable is missing: AUTH_DB_URL");
}

const JWT_SECRET = process.env.JWT_SECRET || "secret string";
const JWT_EXPIRY = process.env.JWT_EXPIRY || '5m';

const db = new pg.Pool({
  connectionString: process.env.AUTH_DB_URL,
  ssl: false
});

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(password, salt);
}

interface UserRequest extends Request {
  email: string;
}

const verifyJWT = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || "";
    const decoded = jwt.verify(token, JWT_SECRET) as UserRequest;
    req.user = decoded.email;
    next();
  } catch(error) {
    res.status(401).json({ error: "not authorized "});
  }
}

const GOOGLE_API = process.env.GOOGLE_API || "https://www.googleapis.com/oauth2/v1/userinfo";
const SERVER_PORT = process.env.SERVER_PORT || 80;
// const UI_URL = process.env.UI_URL || "http://localhost";
// const UI_PORT = process.env.UI_PORT || 5173;

const app = express();
app.use(express.json());
const options = {
  // origin: `${UI_URL}:${UI_PORT}`,
  origin: "*"
  }
app.use(cors(options));

app.use('/api/user', verifyJWT, userRoutes);
app.use('/api/openai', verifyJWT, openAIRoutes);
app.use('/api/deepseek', verifyJWT, deepseekRoutes);

app.get('/api', (req, res) => {
  res.send('Api server is running');
});

app.post("/api/register", async (req, res) => {
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

app.post("/api/login", async (req, res) => {
  // console.log(req.headers);
  // const ipAddress = req.headers['x-forwarded-for'] || 
  //                 req.headers['x-real-ip'] ||
  //                 req.connection.remoteAddress;
  
  // console.log(ipAddress);

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

    // to track login records
    await db.query(`INSERT INTO login_records (email) VALUES ($1)`,
      [email]
    );
    
    const result = await db.query(
      `
    SELECT * from users WHERE email = ($1)
    `,
      [email]
    );
    if(result.rows.length > 0) {
      const app_signin = result.rows[0].app_signin;
      if(app_signin === 'Google') {
        res.status(401).json({ error: `User ${email} signed up using google. Please use Google Sign-in`});
        return;
      }
      const dbPasswordHash = result.rows[0].password_hash;
      await bcrypt.compare(password, dbPasswordHash, (err, result) => {
        if (result) {
            // Passwords match, authentication successful
            // create jwt token
            const payload = {
              email: email
            }
            const options = {expiresIn: JWT_EXPIRY};
            const token = jwt.sign(payload, JWT_SECRET, options);
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

app.post("/api/login/google", async (req, res) => {
  const { accessToken } = req.body;
  try {
    if (!accessToken) {
      res.status(400).json({ error: "Missing required parameter: accessToken" });
      return;
    }

    axios.get(`${GOOGLE_API}?access_token=${accessToken}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json'
        }
    }).then(async (result) => {
      const email = result.data.email;
      const record = await db.query(
        `SELECT * from users WHERE email = ($1)`,
        [email]
      );
      // If no record exist for this email, insert to DB
      if(record.rows.length == 0) {
        const firstname = result.data.given_name || "NA";
        const lastname = result.data.family_name || "NA";
        await db.query(
          `
        INSERT INTO users (email, firstname, lastname, password_hash, app_signin)
          VALUES ($1, $2, $3, $4, $5)
        `,
          [email, firstname, lastname, "", "Google"]
        );
      }

      // create jwt token
      const payload = {
        email: email
      }
      const options = {expiresIn: '10h'};
      const token = jwt.sign(payload, JWT_SECRET, options);
      res.status(200).json({ success: true, token: token, user: email});
    }).catch((err) => {
      console.log(err);
      res.status(500).json({ error: "Authentication failed"});
    });  
  } catch (error: any) {
      console.log(error);
      res.status(500).json({ error: "Internal server error"});
  }
});

app.listen(SERVER_PORT, () => {
  return console.log(`Express is listening at ${SERVER_PORT}`);
});