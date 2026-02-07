import dotenv from "dotenv";
dotenv.config({ path: "../.env"});

import express from "express"
import cors from "cors"
import sessionRouter from "./routes/session.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({"status": "ok"});
});

app.use("/api/session", sessionRouter);

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});