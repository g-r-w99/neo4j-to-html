import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import neo4j from "neo4j-driver";

const ConfigurationPage = () => {
  const [uri, setUri] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nodes, setNodes] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);


  const [configType, setConfigType] = useState("");
  const [configLabel, setConfigLabel] = useState("");
  const [configProps, setConfigProps] = useState("");
  const [configMessage, setConfigMessage] = useState("");
  const [relNode1Label, setRelNode1Label] = useState("");
  const [relNode1Prop, setRelNode1Prop] = useState("");
  const [relNode2Label, setRelNode2Label] = useState("");
  const [relNode2Prop, setRelNode2Prop] = useState("");


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
    setLoading(true);
    try {
      const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
      const session = driver.session();
      const result = await session.run("CALL db.labels() YIELD label RETURN label");
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
    } finally {
      setLoading(false);
    }
  };
  
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
      // console.log(query);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-sky-100 to-white flex flex-col items-center justify-start px-4 py-10 font-sans relative overflow-visible space-y-20">
      <div className="absolute top-6 left-6 flex items-center gap-2 text-blue-800 font-semibold text-xl z-40">
        <svg className="w-6 h-6 text-blue-600 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 11c0-3 3-3 3-6s-3-3-3-3-3 0-3 3 3 3 3 6z" />
          <path d="M12 17v.01" />
          <path d="M12 20h.01" />
        </svg>
        NeoGraph Explorer
      </div>
  
      {connected && (
        <button
          onClick={handleLogout}
          className="absolute top-6 right-6 z-50 flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-md hover:bg-red-600 transition"
        >
          Logout
        </button>
      )}
  
      {/* FIRST BLOCK */}
      {!connected ? (
        <div className="backdrop-blur-md bg-white/70 shadow-xl rounded-3xl px-10 py-12 w-full max-w-lg animate-fadeIn relative z-10">
          <h1 className="text-4xl font-bold text-center text-blue-700 mb-2">Welcome</h1>
          <p className="text-gray-600 text-sm text-center mb-8">Connect to your Neo4j database</p>
  
          <div className="space-y-6">
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="text"
              placeholder="Neo4j URI (e.g., neo4j+s://example.com)"
              value={uri}
              onChange={(e) => setUri(e.target.value)}
            />
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
  
            <div className="relative">
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 pr-12"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.2.66-.485 1.288-.848 1.874M15 15l4.243 4.243M4.222 4.222l15.556 15.556" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4.5c4.392 0 8.25 3.358 9.542 7.5-1.292 4.142-5.15 7.5-9.542 7.5s-8.25-3.358-9.542-7.5C3.75 7.858 7.608 4.5 12 4.5z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
  
            <button
              onClick={connectToNeo4j}
              className="w-full bg-blue-600 text-white py-3 font-semibold rounded-lg hover:bg-blue-700 transition duration-150 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading && (
                <svg className="w-5 h-5 animate-spin text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0110 10" />
                </svg>
              )}
              {loading ? "Connecting..." : "Connect"}
            </button>
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          </div>
        </div>
      ) : (
        <>
          {/* NODE TYPES */}
          <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl px-8 py-10 mt-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Available Node Types</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {nodes.map((node, index) => (
                <div
                  key={index}
                  onClick={() => handleNodeClick(node)}
                  className="cursor-pointer bg-white border border-gray-200 hover:bg-blue-50 hover:shadow-lg transform hover:scale-105 transition-all duration-200 rounded-xl p-4 text-center text-blue-700 font-medium"
                >
                  {node.label}
                </div>
              ))}
            </div>
          </div>
  
          {/* CONFIGURATION SECTION */}
          <div className="bg-white rounded-xl shadow-lg p-8 animate-fadeIn transition-all duration-500 w-full max-w-5xl">
            <h2 className="text-xl font-semibold text-center text-blue-700 mb-4">Configuration</h2>
            <select
              className="w-full max-w-lg mx-auto block px-4 py-3 border border-gray-300 rounded-lg mb-6"
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
              <div className="w-full max-w-2xl mx-auto space-y-4 transition-all duration-500 animate-fadeIn">
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  type="text"
                  placeholder={configType === "node" ? "Node Label" : "Relationship Type"}
                  value={configLabel}
                  onChange={(e) => setConfigLabel(e.target.value)}
                />
  
                {configType === "node" ? (
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    type="text"
                    placeholder='Properties (e.g., {propertyname: "propertyvalue"})'
                    value={configProps}
                    onChange={(e) => setConfigProps(e.target.value)}
                  />
                ) : (
                  <>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      type="text"
                      placeholder="Start Node Label"
                      value={relNode1Label}
                      onChange={(e) => setRelNode1Label(e.target.value)}
                    />
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      type="text"
                      placeholder='Start Node Property (e.g., propertyname: "propertyvalue")'
                      value={relNode1Prop}
                      onChange={(e) => setRelNode1Prop(e.target.value)}
                    />
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      type="text"
                      placeholder="End Node Label"
                      value={relNode2Label}
                      onChange={(e) => setRelNode2Label(e.target.value)}
                    />
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      type="text"
                      placeholder='End Node Property (e.g., propertyname: "propertyvalue")'
                      value={relNode2Prop}
                      onChange={(e) => setRelNode2Prop(e.target.value)}
                    />
                  </>
                )}
  
                <button
                  onClick={handleAddConfig}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
                >
                  Add {configType}
                </button>
  
                {configMessage && (
                  <p className="text-sm text-center text-gray-700 mt-2">{configMessage}</p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
  

};

export default ConfigurationPage;
