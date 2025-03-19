import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import neo4j from "neo4j-driver";
import "./configuration.css";

const ConfigurationPage = () => {
  const [uri, setUri] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nodes, setNodes] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const savedUri = sessionStorage.getItem("neo4j_uri");
    const savedUsername = sessionStorage.getItem("neo4j_username");
    const savedPassword = sessionStorage.getItem("neo4j_password");
     const savedNodes = sessionStorage.getItem("neo4j_nodes");

    if (savedUri && savedUsername && savedPassword) {
        setUri(savedUri);
        setUsername(savedUsername);
        setPassword(savedPassword);
        setConnected(true);
    }

    if (savedNodes) {
        setNodes(JSON.parse(savedNodes)); 
    }
}, []);


  const connectToNeo4j = async () => {
    setError("");
    try {
      const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
      const session = driver.session();

      const result = await session.run(
        "CALL db.labels() YIELD label RETURN label"
      );
      const fetchedNodes = result.records.map((record) => ({
        label: record.get("label"),
      }));

      setNodes(fetchedNodes);
      setConnected(true);

      sessionStorage.setItem("neo4j_uri", uri);
      sessionStorage.setItem("neo4j_username", username);
      sessionStorage.setItem("neo4j_password", password);
      sessionStorage.setItem("neo4j_nodes", JSON.stringify(fetchedNodes)); 


      await session.close();
      await driver.close();
    } catch (err) {
      setError("Failed to connect. Check your credentials and try again.");
      console.error("Connection error:", err);
    }
  };

  const handleNodeClick = (node) => {
    navigate("/cypherquerytester", {
      state: {
        selectedNode: node,
        uri,
        username,
        password,
      },
    });
  };

  const handleLogout = () => {
    sessionStorage.clear(); 
    setUri("");
    setUsername("");
    setPassword("");
    setNodes([]); 
    setConnected(false);
};

  return (
    <div className="container">
      {connected && (
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      )}

      {!connected ? (
        <>
          <h1 className="title">Enter Credentials</h1>
          <div className="input-container-cf">
            <input
              className="input-field"
              type="text"
              placeholder="Neo4j URI (e.g., neo4j+s://example.com)"
              value={uri}
              onChange={(e) => setUri(e.target.value)}
            />
            <input
              className="input-field"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="input-field"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={connectToNeo4j}>Connect</button>
            {error && <p className="error-message">{error}</p>}
          </div>
        </>
      ) : (
        <div>
          <h2 className="title">Available Node Types</h2>
          <div className="nodes-container">
            {nodes.map((node, index) => (
              <div
                key={index}
                onClick={() => handleNodeClick(node)}
                className="node-box"
              >
                {node.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationPage;
