const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;
const initiolizeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started and Running at: http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db error :${e.message}`);
  }
};
initiolizeDbAndServer();

// Converting State Object parameters ( snake_case - camalCase );
const convertStateParamsToCamalCase = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

// Converting District Object parameters ( snake_case - camalCase );
const convertDistrictParamsToCamalCase = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};

//      Tables = (district , state)

// Get All States API (1)
//GET http://localhost:3000/states/
app.get("/states/", async (request, response) => {
  const getAllStatesObjectsQuery = `SELECT * FROM state`;
  const allStatesArray = await db.all(getAllStatesObjectsQuery);
  const convertedAllStatesArray = allStatesArray.map(
    convertStateParamsToCamalCase
  );
  response.send(convertedAllStatesArray);
});

// Get State By stateId API (2)
//GET http://localhost:3000/states/1/
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateObjectQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const state = await db.get(getStateObjectQuery);
  const convertedState = convertStateParamsToCamalCase(state);
  response.send(convertedState);
});

// Create District API (3)           --- District Successfully Added
//POST http://localhost:3000/districts/
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `INSERT INTO district 
                (district_name, state_id, cases, cured, active, deaths) 
                                  VALUES 
('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');`;
  const dbResponse = await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

// Get District By ID API (4)
//GET http://localhost:3000/districts/1/
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  const convertedDistrict = convertDistrictParamsToCamalCase(district);
  response.send(convertedDistrict);
});

// DELETE District By ID API (5)    --- District Removed
//DELETE http://localhost:3000/districts/1/
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id = ${districtId};`;
  const dbResponse = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// UPDATE District By ID API (6)    --- District Details Updated
//PUT http://localhost:3000/districts/2/ --district_name, state_id, cases, cured, active, deaths
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `UPDATE district SET district_name = '${districtName}',
                                                        state_id = ${stateId},
                                                        cases = ${cases},
                                                        cured = ${cured},
                                                        active = ${active},
                                                        deaths = ${deaths};`;
  const dbResponse = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// GET Stats of State by stateId API (7)
//GET http://localhost:3000/states/2/stats/

// app.get("/states/:stateId/stats/", async (request, response) => {
//   const { stateId } = request.params;
//   const districtDetails = request.body;
//   const { cases, cured, active, deaths } = districtDetails;
//   const getStatsQuery = `SELECT SUM(cases) as totalCases,
//                                      SUM(cured) as totalCured,
//                                      SUM(active) as totalActive,
//                                      SUM(deaths) as totalDeaths
//                             FROM district WHERE state_id = ${stateId};`;
//   const stats = await db.get(getStatsQuery);
//   response.send(stats);
// });

app.get("/states/:stateId/stats", async (request, response) => {
  const { stateId } = request.params;

  const getStatisticsQuery = `SELECT SUM(cases) as totalCases,
                                       SUM(cured) as totalCured,
                                       SUM(active) as totalActive,
                                       SUM(deaths) as totalDeaths
                                FROM district WHERE state_id = ${stateId};`;
  const statistics = await db.get(getStatisticsQuery);
  response.send(statistics);
});

// GET stateName of District by districtId API (8)
//GET http://localhost:3000/districts/2/details/
app.get("/districts/:districtId/details", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `SELECT state_name from district 
                                            INNER JOIN state
                                    on district.state_id = state.state_id 
                                    WHERE district_id = ${districtId};`;
  const stateName = await db.get(getStateNameQuery);
  response.send(convertStateParamsToCamalCase(stateName));
});
module.exports = app;
