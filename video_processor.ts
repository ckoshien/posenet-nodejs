import * as fs from "fs";
import ffmpeg from "fluent-ffmpeg";

const generateProcentage = (number: number) =>
  [...Array(number)].map(
    (i, index) => `${index * (100 / number) + 100 / number / 2}%`
  );

const generateImages = async (name: string, length: number) => {
  return new Promise((resolve, reject) => {
    ffmpeg(`./videos/${name}.mp4`)
      .screenshots({
        timestamps: generateProcentage(length),
        filename: `${name}_%0i.png`,
        folder: `./images/${name}`,
        size: "1280x720",
      })
      .on("progress", (progress: number) => {
        console.log(`[ffmpeg] ${JSON.stringify(progress)}`);
      })
      .on("error", (err: Error) => {
        console.log(`[ffmpeg] error: ${err.message}`);
        reject(err);
      })
      .on("end", () => {
        console.log("[ffmpeg] finished");
        resolve("");
      });
  });
};

const generateVideo = async (name: string) => {
  return new Promise((resolve, reject) => {
    const path = `./images/${name}/`
    const files = fs.readdirSync(path);
    const inputted = ffmpeg(`./videos/${name}.mp4`);
    files
      .filter((file) => {
        return file.includes(`r${name}`);
      })
      .forEach((file) => {
        inputted.input(path + file);
      });
    inputted
      .complexFilter([`overlay=x=(W-w)/2:y=(H-h)/2`])
      .saveToFile(`./videos/${name}_r.mp4`)
      .inputFPS(20)
      .on("error", (error) => {
        reject("ffmpeg transcoding error: " + error);
      })
      .on("end", () => {
        console.log("done!");
        resolve(true);
      })
      .run();
  });
};

export { generateImages, generateVideo };
