import express from "express";
import * as utils from "./utils/utils.js";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
import { projectInfo } from "./build/1-project-bundle/projectMeta.js";

const app = express();
const port = 8081;

app.use(express.static("public"));
// app.get("/", (req, res) => {
//   res.send("NFT bundler by David G. Smith.");
// });

// app.post("/build-anims", async (req, res) => {
//   await utils
//     .buildAnimationFiles()
//     .then(() => {
//       res.send({ result: "animations built" });
//     })
//     .catch((err) => {
//       console.log(err);
//       res.send({ result: "failure during animation builds" });
//     });
// });

// app.post("/capture-images", async (req, res) => {
//   await utils
//     .capturePreviewImages()
//     .then(() => {
//       res.send({ result: "images captured" });
//     })
//     .catch((err) => {
//       console.log(err);
//       res.send({ result: "failure during image captures" });
//     });
// });

// app.post("/pin-images-and-anims", async (req, res) => {
//   await utils
//     .pinImagesAndAnims()
//     .then(() => {
//       res.send({ result: "images and anims pinned" });
//     })
//     .catch((err) => {
//       console.log(err);
//       res.send({ result: "failure during image and anim pinning" });
//     });
// });

// app.post("/build-and-pin-final-metas", async (req, res) => {
//   await utils
//     .buildFinalMetaAndPinToIPFS()
//     .then(() => {
//       res.send({ result: "final metas built and pinned" });
//     })
//     .catch((err) => {
//       console.log(err);
//       res.send({ result: "failure building and pinning final metas" });
//     });
// });

// app.post("/build-and-pin-project-metas", async (req, res) => {
//   await utils
//     .buildProjectMetaAndPinToIPFS()
//     .then(() => {
//       res.send({ result: "project meta built and pinned" });
//     })
//     .catch((err) => {
//       console.log(err);
//       res.send({ result: "failure building and pinning project meta" });
//     });
// });

app.post("/build-sequence", async (req, res) => {
  await utils
    .completeBuildAndDeploySequence()
    .then(() => {
      res.send({ result: "full sequence completed" });
    })
    .catch((err) => {
      console.log(err);
      res.send({ result: "failure running full sequence" });
    });
});

app.get("/iframe", async (req, res) => {
  let hash = req.query.hash || "ffffffffffffffff";
  let iFrameData = await utils.getIframeString(hash);
  res.send(iFrameData);
});

app.post("/get-project-data", async (req, res) => {
  res.send(projectInfo);
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
