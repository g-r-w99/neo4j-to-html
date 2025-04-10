import React, { useState, useEffect } from "react";
import "./configuration.css";  //this doesnt work for this page but does for the rest.
// import "./CypherQueryTester.css"  //this messes up the existing css, but works for this page 
import { useLocation } from "react-router-dom";
import neo4j from "neo4j-driver";
function CypherQueryTester() {
  const { state } = useLocation();
  const {
    selectedNode = {},
    uri = "",
    username = "",
    password = "",
  } = state || {};
  const { label: nodeLabel } = selectedNode || {};



  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [resultsPageContent, setResultsPageContent] = useState("");
  const [queryType, setQueryType] = useState("");
  const [driver, setDriver] = useState(null);
  const [menuOptions, setMenuOptions] = useState([]);

  useEffect(() => {
    let storedUri = sessionStorage.getItem("neo4j_uri") || uri;
    let storedUsername = sessionStorage.getItem("neo4j_username") || username;
    let storedPassword = sessionStorage.getItem("neo4j_password") || password;

    if (storedUri && storedUsername && storedPassword) {
      const neo4jDriver = neo4j.driver(storedUri, neo4j.auth.basic(storedUsername, storedPassword));
      setDriver(neo4jDriver);
    }


  }, []);
  useEffect(() => {
    if (driver && nodeLabel) {
      fetchDynamicMenuOptions();
    }
  }, [driver, nodeLabel]);


  const fetchDynamicMenuOptions = async () => {
    if (!driver || !nodeLabel) return;

    try {
      const session = driver.session();
      const result = await session.run(
        `MATCH (n:${nodeLabel})-[r]->() RETURN DISTINCT type(r) AS relType, 'OUTGOING' AS direction
           UNION
           MATCH (n:${nodeLabel})<-[r]-() RETURN DISTINCT type(r) AS relType, 'INCOMING' AS direction`
      );

      const options = result.records.map((record) => ({
        name: `${record.get("relType")} (${record.get("direction")})`,
        query: `MATCH (n:${nodeLabel})${record.get("direction") === "OUTGOING" ? "-[r:" : "<-[r:"}${record.get("relType")}]${record.get("direction") === "OUTGOING" ? "->(m)" : "-(m)"} 
                  RETURN n, r, m LIMIT 10`
      }));

      setMenuOptions(options);
      await session.close();
    } catch (error) {
      console.error("Error fetching dynamic menu options:", error);
    }
  };



  const generateResultsPage = (data) => {
    const getRandomColor = () => {
      const h = Math.floor(Math.random() * 360);
      const s = Math.floor(50 + Math.random() * 30);
      const l = Math.floor(65 + Math.random() * 20);
      return `hsl(${h}, ${s}%, ${l}%)`;
    };

    const nodes = [];
    const links = [];
    const nodeTypeColors = {};

    data.forEach((item) => {
      Object.values(item).forEach((entry) => {
        if (entry.startNodeElementId && entry.endNodeElementId && entry.type) {
          links.push({
            id: entry.elementId,
            source: entry.startNodeElementId,
            target: entry.endNodeElementId,
            type: entry.type,
          });
        } else if (entry.elementId && entry.labels && entry.properties) {
          const nodeLabel = entry.labels[0];
          if (!nodeTypeColors[nodeLabel]) {
            nodeTypeColors[nodeLabel] = getRandomColor();
          }
          nodes.push({
            id: entry.elementId,
            label: entry.labels[0],
            properties: entry.properties,
            color: nodeTypeColors[nodeLabel],
          });
        }
      });
    });
    const uniqueNodes = Array.from(
      new Map(nodes.map((node) => [node.id, node])).values()
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background-color: #f9f9f9;
            overflow:hidden;
            margin:0;
          }
          h1 {
            text-align: center;
            
          }
          #graph-container {
            width: 100%;
            height: auto;
            margin-top: 20px;
            overflow: hidden;
            position: relative;
          }
          text {
            font-size: 12px;
          }


          .node-details {
            display: none;
            margin-top: 15px;
            
            font-size: 14px;
            color: #444;
            line-height: 1.6;
            background: #f9f9f9;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.1);
            max-height: 100px; /* Limit height for details */
            overflow-y: auto; /* Scrollable details */
          }

          .node-card h3 {
            margin: 0;
            font-size: 16px;
            font-weight: bold;
            color: #333;
          }

          .node-card p {
            margin: 0;
            font-size: 14px;
            color: #666;
          }

          .node-details p {
            margin: 5px 0;
            font-size: 12px;
            color: #444;
          }
          .link-label {
            font-size: 14px;
            font-weight: bold;
            fill: #333;
          }

        </style>
        <script src="https://d3js.org/d3.v6.min.js"></script>
      </head>
      <body>
        <div id="instruction-text" style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.8); color: white; padding: 8px 12px;
            border-radius: 5px; font-size: 14px;">
            Drag the nodes to move them around!
        </div>

        <div id="graph-container"></div>
        <script>
          const nodes = ${JSON.stringify(uniqueNodes)};
          const links = ${JSON.stringify(links)};

          setTimeout(() => {
                  d3.select("#instruction-text")
                    .transition()
                    .duration(2000)  
                    .style("opacity", 0.2); 
                }, 4000);

          const width = window.innerWidth * 0.9;  
          const height = window.innerHeight * 0.9; 

          const svg = d3.select('#graph-container')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', "0 0 " + width + " " + height)
            .style('display', 'block'); 
  
          const simulation = d3.forceSimulation(nodes)
            .force('charge', d3.forceManyBody().strength(-600))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('link', d3.forceLink(links).id(d => d.id).distance(200))
            .force('collide', d3.forceCollide().radius(20).strength(1));


          simulation.alpha(1).restart(); 

          function showHandAnimation() {
            setTimeout(() => {
              const simNodes = simulation.nodes(); 
              if (simNodes.length === 0) return; 

              const randomNode = simNodes[Math.floor(Math.random() * simNodes.length)]; 
              if (!randomNode) return; // Ensure it's valid

              const handIcon = d3.select("#graph-container")
                .append("img")
                .attr("src", "hand.svg")  
                .attr("class", "hand-icon")
                .style("position", "absolute")
                .style("width", "40px") 
                .style("height", "40px")
                .style("opacity", 1)
                .style("left", randomNode.x + "px") 
                .style("top", randomNode.y + "px");

              let dragCount = 0;
              function animateHand() {
                if (dragCount > 3) {
                  handIcon.transition().duration(2000).style("opacity", 0).remove(); 
                  return;
                }
                handIcon.transition()
                  .duration(500)
                  .style("left", (randomNode.x + 20) + "px") // Move right
                  .style("top", (randomNode.y + 10) + "px")
                  .transition()
                  .duration(500)
                  .style("left", (randomNode.x - 10) + "px") // Move left
                  .style("top", (randomNode.y - 10) + "px")
                  .on("end", () => {
                    dragCount++;
                    animateHand();
                  });
              }
              animateHand();
            }, 1000); 
          }

          simulation.on("end", showHandAnimation); 

          const dragHandler = d3.drag()
            .on("start", (event, d) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on("drag", (event, d) => {
              d.fx = event.x;
              d.fy = event.y;
            })
            .on("end", (event, d) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            });


          const nodeElements = svg.selectAll('.node')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('class', 'node')
            .attr('r', 6) 
            .attr('fill', d => d.color || '#3498db') 
            .call(dragHandler); 
         
          const linkElements = svg.selectAll('.link')
            .data(links)
            .enter()
            .append('line')
            .attr('class', 'link')
            .style('stroke', '#aaa')
            .style('stroke-width', 2);

          const linkLabels = svg.selectAll('.link-label')
            .data(links)
            .enter()
            .append('text')
            .attr('class', 'link-label')
            .attr('text-anchor', 'middle')
            .attr('dy', -5) 
            .text(d => d.type); 
    
    
          const nodeCards = d3.select('#graph-container')
            .selectAll('.node-card')
            .data(nodes)
            .enter()
            .append('div')
            .attr('class', 'node-card')
            .style('position', 'absolute')
            .style('background', d => d.color)
            .style('border-radius', '12px')
            .style('padding', '10px')
            .style('color', '#333333')
            .style('box-shadow', '0px 4px 8px rgba(0, 0, 0, 0.1)')
            .style('width', '150px') 
            .style('height', 'auto') 
            .style('overflow', 'hidden') 
            .style('transition', 'transform 0.2s, box-shadow 0.2s') 
            .style('cursor', 'pointer')
            .each(function (d) {
              const card = d3.select(this);
              card.append('h3')
                .style('margin', '0 0 10px 0') 
                .style('font-size', '18px') 
                .style('font-weight', '600') 
                .style('color', '#333') 
                .style('text-align', 'center') 
                .text(d.properties.name || d.properties.title);

              card.append('p')
                .style('margin', '0') 
                .style('font-size', '14px') 
                .style('color', '#666') 
                .style('text-align', 'center')
                .text(d.label);

              const detailsDiv = card.append('div')
                .attr('class', 'node-details')
                .style('display', 'none')
                .style('margin-top', '10px')
                .style('font-size', '12px')
                .style('color', '#eee');

              for (const key in d.properties) {
                if (d.properties.hasOwnProperty(key)) {
                  detailsDiv.append('p')
                    .text(key + ': ' + d.properties[key]);
                }
              }
            })
            .on('click', function (event, d) {
              const card = d3.select(this);
              const isExpanded = card.classed('expanded'); 
              if (isExpanded) {
                card.classed('expanded', false) 
                  .style('width', '150px')
                  .style('height', 'auto')
                  .style('background', d.color)
                  .style('box-shadow', '0px 4px 8px rgba(0, 0, 0, 0.1)')
                  .style('z-index', 1);

                
                const detailsDiv = card.select('.node-details');
                detailsDiv.style('display', 'none');
              } else {
               
                card.classed('expanded', true) 
                  .style('width', '300px')
                  .style('background', '#fff')
                  .style('box-shadow', '0px 4px 12px rgba(0, 0, 0, 0.2)')
                  .style('z-index', 1000);

                
                 const detailsDiv = card.select('.node-details');
                if (d.properties.image_data) {
                  detailsDiv.append('img')
                      .attr('src', 'data:image/jpeg;base64,' + d.properties.image_data)
                      .style('width', '100%')
                      .style('border-radius', '8px')
                      .style('margin-top', '10px');
              }
                detailsDiv.style('display', 'block')
                  .style('margin-top', '10px')
                  .style('font-size', '14px')
                  .style('color', '#444')
                  .style('line-height', '1.6')
                  .style('background', '#f9f9f9')
                  .style('border-radius', '8px')
                  .style('padding', '10px')
                  .style('box-shadow', '0px 2px 6px rgba(0, 0, 0, 0.1)')
                  .style('max-height', '150px')
                  .style('overflow-y', 'auto');
              }
            });
          dragHandler(nodeCards);

          function constrainToBoundary(d) {
            const cardWidth = 150; 
            const cardHeight = 100;
            d.x = Math.max(0, Math.min(width - cardWidth, d.x));
            d.y = Math.max(0, Math.min(height - cardHeight, d.y));
          }
  
          function constrainLinkLabel(d) {
            const labelPadding = 10; 
            let midX = (d.source.x + d.target.x) / 2;
            let midY = (d.source.y + d.target.y) / 2;
            d.labelX = Math.max(labelPadding, Math.min(width - labelPadding, midX));
            d.labelY = Math.max(labelPadding, Math.min(height - labelPadding, midY));
          }


          simulation.on('tick', () => {
            nodes.forEach(constrainToBoundary);
            links.forEach(constrainLinkLabel);

            nodeCards
              .style('left', d => d.x + 'px')
              .style('top', d => d.y + 'px');

            linkElements
            .attr('x1', d => {
              return d.source.x;
            })
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
          

            linkLabels
            .attr('x', d => (d.source.x + d.target.x) / 2) 
            .attr('y', d => (d.source.y + d.target.y) / 2);
                  });
        </script>
      </body>
      </html>
    `;

    setResultsPageContent(htmlContent);
  };

  useEffect(() => {
    if (driver && nodeLabel) {
      fetchDynamicMenuOptions();
    }
  }, [driver, nodeLabel]);


  const executeQuery = async () => {
    if (!query) {
      setError("Please select a query.");
      return;
    }
    setError(null);

    let storedUri = sessionStorage.getItem("neo4j_uri");
    let storedUsername = sessionStorage.getItem("neo4j_username");
    let storedPassword = sessionStorage.getItem("neo4j_password");

    if (!storedUri || !storedUsername || !storedPassword) {
      sessionStorage.clear();
      window.location.href = "/";
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cypher: query,
          uri: storedUri,
          username: storedUsername,
          password: storedPassword,
        }),
      });

      const data = await response.json();
      setResult(data);
      generateResultsPage(data);
    } catch (err) {
      setError("Error executing query. Please check the backend.");
      console.error("Error:", err);
    }
  };


  const handleQueryTypeChange = (e) => {
    const selectedOption = menuOptions.find((opt) => opt.name === e.target.value);
    setQueryType(e.target.value);
    setQuery(selectedOption ? selectedOption.query : "");
  };

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = "/";
  };


  return (

    <div className="cypher-query-tester">
      <h1>Cypher Query Tester</h1>



      <p>Node: {nodeLabel}</p>
      {error && <p className="error">{error}</p>}

      <select value={queryType} onChange={handleQueryTypeChange}>
        <option value="">Select Query Type</option>
        {menuOptions.map((option, index) => (
          <option key={index} value={option.name}>
            {option.name}
          </option>
        ))}
      </select>

      <button onClick={executeQuery}>Visualize</button>

      <div className="cypher-query-results">
        <iframe
          srcDoc={resultsPageContent}
          title="Results"
          className="results-iframe"
        ></iframe>
      </div>

      <button onClick={handleLogout} className="logout-button">Logout</button>
    </div>
  );
}

export default CypherQueryTester;