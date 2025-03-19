# neo4j-to-html (NtH): Neo4j Query Visualization Tool

## Overview
NtH is a web-based tool that allows users to execute Neo4j Cypher queries and visualize the results dynamically. Designed for researchers, developers, and data analysts, NeoVis simplifies graph database exploration by providing an intuitive and interactive interface.

## Features
- Execute **Neo4j Cypher queries** directly from the UI
- Visualize **nodes and relationships** in an interactive graph
- Supports **incoming and outgoing relationships**
- **Dynamic menu generation** based on relationships
- Uses **React** for the frontend and **Express.js** for backend query handling

## Prerequisites
- **Node.js** (v14 or higher recommended)
- **Neo4j Database** (AuraDB)
- **npm** for dependency management

## Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/g-r-w99/neo4j-to-html.git
   cd neovis
   ```
2. Install dependencies:
   ```sh
   Backend:
   cd backend
   npm install express neo4j-driver cors
=   ```
   ```sh
   Frontend:
   cd frontend
   npm install 
   ```

## Usage
### Start the Backend Server
Run the Express.js server:
```sh
   cd backend
   node index.js   
```

### Start the Frontend
Run the React application:
```sh
   cd frontend

   npm start
```
The application will be available at `http://localhost:3000`



## Contributing
1. Fork the repository
2. Create a new branch (`git checkout -b feature-branch`)
3. Commit your changes (`git commit -m "Add new feature"`)
4. Push to the branch (`git push origin feature-branch`)
5. Open a Pull Request


## Tech Stack
- **Frontend:** React, D3.js, CSS
- **Backend:** Express.js, Neo4j Driver
- **Database:** Neo4j (AuraDB or self-hosted)



## Contributors
- Gadha R Warrier (https://github.com/g-r-w99)
- Vasana Srinivasan (https://github.com/vx3540)

