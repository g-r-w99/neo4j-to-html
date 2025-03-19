const express = require("express");
const cors = require("cors");
const neo4j = require("neo4j-driver");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post("/query", async (req, res) => {
  const { cypher, uri, username, password } = req.body;

  if (!cypher || !uri || !username || !password) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  const session = driver.session();

  try {
    const result = await session.run(cypher);
    const data = result.records.map((record) => record.toObject());
    res.json(data);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
    await driver.close(); 
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
