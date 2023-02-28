const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const { Pool, Client } = require("pg");
const app = express();
const { connectPostgres } = require("../db/db");
require("dotenv").config();
const apiRouter = require("./api/routers/apiRouter");
const tf = require("@tensorflow/tfjs-node");
const path = require("path");
const fs = require("fs");
const middlewares = require("./middlewares");
const api = require("./api");
const { faker } = require("@faker-js/faker");

const modelJson = fs.readFileSync(
  path.join(__dirname, "../scraper/json_model/model.json"),
  "utf8"
);

const modelData = JSON.parse(modelJson);

app.use(morgan("dev"));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  (async () => {
    // Load the model
    const model = await tf.loadLayersModel(
      `file://${path.join(__dirname, "../scraper/json_model/model.json")}`
    );

    const summary = model.summary();

    // const testData = {
    //   pitch_type: faker.datatype.number({ min: 1, max: 7 }),
    //   release_speed: faker.datatype.number({ min: 80, max: 100 }),
    //   zone: faker.datatype.number({ min: 1, max: 9 }),
    //   p_throws: faker.datatype.number({ min: 1, max: 2 }),
    //   balls: faker.datatype.number({ min: 0, max: 3 }),
    //   strikes: faker.datatype.number({ min: 0, max: 2 }),
    //   on_3b: faker.datatype.number({ min: 0, max: 1 }),
    //   on_2b: faker.datatype.number({ min: 0, max: 1 }),
    //   on_1b: faker.datatype.number({ min: 0, max: 1 }),
    //   outs_when_up: faker.datatype.number({ min: 0, max: 2 }),
    //   pitch_number: faker.datatype.number({ min: 1, max: 8 }),
    //   home_score: faker.datatype.number({ min: 0, max: 10 }),
    //   away_score: faker.datatype.number({ min: 0, max: 10 }),
    // };

    // console.table(testData);

    const testSample = tf.tensor2d([Object.values(testData)], [1, 13]);
    const testLabels = tf.oneHot(
      faker.datatype.number({ min: 0, max: 17 }),
      18
    );

    const prediction = model.predict(testSample, testLabels);
    const t = prediction.argMax(-1).dataSync();
    const hr_idx =
      modelData.userDefinedMetadata.class_labels.indexOf("event_home_run");
    // const probabilitiesByIndex = prediction.dataSync().map((x, idx) => {
    //   return {
    //     [modelData.userDefinedMetadata.class_labels[idx]]: x,
    //   };
    // });

    const probabilitiesByIndex = prediction.dataSync().map((x, idx) => {
      console.log(modelData.userDefinedMetadata.class_labels[idx], x);

      return x;
    });

    console.log({ probabilitiesByIndex });
    // console.log(modelData.class_names[t]);

    // model.predict(tf.zeros([0, 13])).print("hi");
    res.send("Model Loaded Successfully!");
  })();
});

app.post("/predict", async (req, res) => {
  (async () => {
    // Load the model
    const model = await tf.loadLayersModel(
      `file://${path.join(__dirname, "../scraper/json_model/model.json")}`
    );

    const {
      pitchType,
      pitchSpeed,
      pitchHand,
      balls,
      strikes,
      zone,
      runnerOnThird,
      runnerOnSecond,
      runnerOnFirst,
      outs,
      pitchNumber,
      homeScore,
      awayScore,
    } = req.body;

    const data = {
      pitch_type: parseInt(pitchType),
      release_speed: parseInt(pitchSpeed),
      zone: parseInt(zone),
      p_throws: parseInt(pitchHand),
      balls: parseInt(balls),
      strikes: parseInt(strikes),
      on_3b: parseInt(runnerOnThird),
      on_2b: parseInt(runnerOnSecond),
      on_1b: parseInt(runnerOnFirst),
      outs_when_up: parseInt(outs),
      pitch_number: parseInt(pitchNumber),
      home_score: parseInt(homeScore),
      away_score: parseInt(awayScore),
    };

    console.table(data);

    const labels = tf.oneHot(faker.datatype.number({ min: 0, max: 17 }), 18);
    const pitch = tf.tensor2d([Object.values(data)], [1, 13]);

    const prediction = model.predict(pitch, labels);
    const t = prediction.argMax(-1).dataSync();
    const hr_idx =
      modelData.userDefinedMetadata.class_labels.indexOf("event_home_run");

    const probabilitiesByIndex = prediction.dataSync().map((x, idx) => {
      return x;
    });
    console.log(probabilitiesByIndex[hr_idx]);

    // console.log({ probabilitiesByIndex });
    res.json({
      data: probabilitiesByIndex,
      // average: modelData.userDefinedMetadata.average,
    });
  })();
});

app.use("/api/v1", apiRouter);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;
