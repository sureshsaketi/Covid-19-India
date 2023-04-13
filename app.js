const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
// Notation conversion
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

initializeDBAndServer();

// API 1 GET Method for return all states list
app.get("/states/", async (request, response) => {
  const getStatesQuery = ` 
     SELECT * FROM state ;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => {
      return convertDbObjectToResponseObject(eachState);
    })
  );
});

// API 2 GET Method // GET Method returns based on the state ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    SELECT * FROM state 
    WHERE state_id = ${stateId};`;
  let getState = await db.get(stateQuery);
  response.send(convertDbObjectToResponseObject(getState));
});

// API 3 POST Method
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrict = `
    INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
    VALUES(
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );
    `;
  await db.run(updateDistrict);
  response.send("District Successfully Added");
});
//
const convertCamelCAseToPascalCase = (districtObject) => {
  return {
    districtId: districtObject.district_id,
    districtName: districtObject.district_name,
    stateId: districtObject.state_id,
    cases: districtObject.cases,
    cured: districtObject.cured,
    active: districtObject.active,
    deaths: districtObject.deaths,
  };
};

//API 4 GET Method Returns a district based on the district ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * FROM district WHERE district_id =${districtId}
    ;`;
  let getDistrictDetails = await db.get(getDistrictQuery);
  response.send(convertCamelCAseToPascalCase(getDistrictDetails));
  console.log(getDistrictDetails);
});

//API 5 Deletes a district from the district table based on the district ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId} ;
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});
//API 6 Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
  UPDATE district 
  SET
  
      district_name = '${districtName}',
      state_id = ${stateId},
      cases = ${cases},
      cured = ${cured},
      active = ${active},
      deaths = ${deaths};
  `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// API 7 GET METHOD Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesStatsQuery = `
    SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM 
   district
   WHERE state_id = ${stateId}
    ;
    `;
  let stats = await db.get(getStatesStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

// API 8 GET METHOD Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetails = `
    SELECT
    state_name 
    FROM
     district NATURAL JOIN state 
    WHERE district_id = ${districtId} 
    ;`;
  let statesName = await db.get(getDistrictDetails);
  response.send({
    stateName: statesName["state_name"],
  });
});

module.exports = app;
