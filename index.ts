import { Keypoint, PoseNet } from "@tensorflow-models/posenet";
import * as fetch from "node-fetch";
import { Canvas, Image, createCanvas } from "canvas";
const fs = require("fs");
const posenet = require("@tensorflow-models/posenet");
import * as tf from "@tensorflow/tfjs";
require("@tensorflow/tfjs-node");
import * as utils from "./utils";

import * as videoProcessor from "./video_processor";

const drawKeypoints = (
  name: string,
  index: number,
  canvas: Canvas,
  keypoints: Keypoint[]
) => {
  const ctx = canvas.getContext("2d");
  keypoints.forEach((key, index) => {
    //if (index > 4 && index < 11) {
    ctx.beginPath();
    ctx.arc(key.position.x, key.position.y, 3, 0, 2 * Math.PI, false);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#00ff00";
    ctx.stroke();
    //}
  });
  const buf = canvas.toBuffer();
  fs.writeFileSync(
    `./images/${name}/r${name}_${utils.formatIndex(index)}.jpg`,
    buf
  );
  fs.writeFileSync(
    `./images/${name}/d${name}_${utils.formatIndex(index)}.json`,
    JSON.stringify(keypoints),
    "utf-8"
  );
  console.log(`./images/${name}/d${name}_${utils.formatIndex(index)}.json`);
};

const run = async (net: PoseNet, name: string, index: number) => {
  console.log(index);
  let img_path = `./images/${name}/${name}_${utils.formatIndex(index)}.png`;
  let { Response } = fetch;
  let stream = fs.createReadStream(img_path);
  let buffer = await new Response(stream).buffer();
  let img = new Image();
  img.src = buffer;
  const canvas = createCanvas(img.width, img.height);
  canvas.getContext("2d").drawImage(img, 0, 0);
  // @ts-ignore
  const poses = await net.estimateMultiplePoses(canvas, {
    flipHorizontal: false,
    maxDetections: 2,
    scoreThreshold: 0.5,
    nmsRadius: 20,
  });
  poses.forEach((pose) => {
    drawKeypoints(name, index, canvas, pose.keypoints);
  });
};

const main = async () => {
  try {
    const length = 20;
    const filename = "test";

    await videoProcessor.generateImages(filename, length);
    const net = await posenet.load({
      architecture: "ResNet50",
      outputStride: 32,
      inputResolution: { width: 1280, height: 720 },
      quantBytes: 2,
    });
    let index = 0;
    while (index < length) {
      await run(net, filename, index + 1);
      index++;
    }
    videoProcessor.generateVideo(filename)
  } catch (err) {
    console.log(err);
  }
};

main();
