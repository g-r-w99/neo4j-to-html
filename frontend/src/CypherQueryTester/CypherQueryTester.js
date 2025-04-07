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
  const [configType, setConfigType] = useState("");
  const [configLabel, setConfigLabel] = useState("");
  const [configProps, setConfigProps] = useState("");
  const [configMessage, setConfigMessage] = useState("");
  const [relNode1Label, setRelNode1Label] = useState("");
  const [relNode1Prop, setRelNode1Prop] = useState("");
  const [relNode2Label, setRelNode2Label] = useState("");
  const [relNode2Prop, setRelNode2Prop] = useState("");

  const handleAddConfig = async () => {
    setConfigMessage("");

    if (!configLabel) {
      setConfigMessage("Label or type is required.");
      return;
    }

    try {
      const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
      const session = driver.session();
      console.log(configLabel);
      console.log(configProps);
      let query = "";
      if (configType === "node") {
        query = `CREATE (n:${configLabel} {${configProps}}) RETURN n`;
      }
      if (configType === "relationship") {
        if (
          !relNode1Label ||
          !relNode1Prop ||
          !relNode2Label ||
          !relNode2Prop ||
          !configLabel
        ) {
          setConfigMessage("Please fill all fields for relationship creation.");
          return;
        }

        const prop1 = relNode1Prop;
        const prop2 = relNode2Prop;
        query = `
      MATCH (a:${relNode1Label} {${prop1}}), (b:${relNode2Label} {${prop2}})
      CREATE (a)-[:${configLabel}]->(b)
      RETURN a, b
    `;
      }
      const result = await session.run(query);
      if (result.records.length > 0) {
        setConfigMessage("Successfully added.");
      } else {
        setConfigMessage("Failed to add. Please check input.");
      }

      await session.close();
      await driver.close();
    } catch (err) {
      setConfigMessage("Error occurred while adding.");
      console.error("Add Config Error:", err);
    }
  };

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

          <div className="config-section">
            <h2 className="title">Configuration</h2>
            <select
              className="input-field"
              value={configType}
              onChange={(e) => {
                setConfigType(e.target.value);
                setConfigLabel("");
                setConfigProps("");
              }}
            >
              <option value="">Select Type</option>
              <option value="node">Add Node</option>
              <option value="relationship">Add Relationship</option>
            </select>

            {configType && (
              <div className="input-container-cf">
                <input
                  className="input-field"
                  type="text"
                  placeholder={
                    configType === "node" ? "Node Label" : "Relationship Type"
                  }
                  value={configLabel}
                  onChange={(e) => setConfigLabel(e.target.value)}
                />

                {configType === "node" ? (
                  <input
                    className="input-field"
                    type="text"
                    placeholder='Properties (e.g., {propertyname: "propertyvalue"})'
                    value={configProps}
                    onChange={(e) => setConfigProps(e.target.value)}
                  />
                ) : (
                  <>
                    <input
                      className="input-field"
                      type="text"
                      placeholder="Start Node Label"
                      value={relNode1Label}
                      onChange={(e) => setRelNode1Label(e.target.value)}
                    />
                    <input
                      className="input-field"
                      type="text"
                      placeholder='Start Node Property (e.g., propertyname: "propertyvalue")'
                      value={relNode1Prop}
                      onChange={(e) => setRelNode1Prop(e.target.value)}
                    />
                    <input
                      className="input-field"
                      type="text"
                      placeholder="End Node Label"
                      value={relNode2Label}
                      onChange={(e) => setRelNode2Label(e.target.value)}
                    />
                    <input
                      className="input-field"
                      type="text"
                      placeholder='End Node Property (e.g., propertyname: "propertyvalue")'
                      value={relNode2Prop}
                      onChange={(e) => setRelNode2Prop(e.target.value)}
                    />
                  </>
                )}

                <button onClick={handleAddConfig}>Add {configType}</button>
                {configMessage && <p>{configMessage}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationPage;
