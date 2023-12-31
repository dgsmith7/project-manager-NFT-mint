import fs from "fs-extra";
import { animStrings } from "./animation-strings.js";
import { projectInfo } from "../build/1-project-bundle/projectMeta.js";
import nodeHtmlToImage from "node-html-to-image";
import dotenv from "dotenv";
dotenv.config();
import pinataSDK from "@pinata/sdk";
const pinata = new pinataSDK(
  process.env.pinata_api_key,
  process.env.pinata_secret_api_key
); // authenticates when using 'pinata'

("use strict");

let finalProjectJSON = `{"project": "${projectInfo.projectName}","elements":[`;
let imageIPFS = [];
let animIPFS = [];
let finalMetaIPFS = [];
let projectMetaIPFS = "";

export async function completeEntireSequence() {
  let seq = [
    // buildAnimationFiles,
    // capturePreviewImages,
    // pinImagesAndAnims,
    // buildFinalMetaAndPinToIPFS,
    // buildProjectMetaAndPinToIPFS,
    // buildScriptsForDatabase,
  ];
  for (const fn of seq) await fn().then(console.log("Completing " + fn.name));
}

export async function getIframeString(hash) {
  const webpackCode = fs
    .readFileSync("./build/1-project-bundle/main.js")
    .toString();
  let tokenString = 'let tokenData = {\n"tokenHash": "0x' + hash + '",\n';
  tokenString += `"tokenId": "ffffffffffffffff",\n`;
  tokenString += `"projectName": "test",\n`;
  tokenString += `"artistName": "tester",\n`;
  tokenString += `"properties": {"placeholder": "here"},\n`;
  tokenString += `"toData": {"placeholder": "here"}\n}\n`;
  let finalString =
    "<!DOCTYPE html>\n<html>\n<head>\n<title>Test</title>\n</head>\n<body>\n<script>\n" +
    tokenString +
    "class BaconRand {\nconstructor(_tokenData) {\nthis.hashVal = parseInt(_tokenData.tokenHash.slice(2), 16);\n}\nrand() { // mulberry32 from https://github.com/bryc/code/blob/master/jshash/PRNGs.md\nlet t = (this.hashVal += 0x6d2b79f5);\nt = Math.imul(t ^ (t >>> 15), t | 1);\nt ^= t + Math.imul(t ^ (t >>> 7), t | 61);\nreturn ((t ^ (t >>> 14)) >>> 0) / 4294967296;\n}\n}\nconst baconRand = new BaconRand(tokenData);\nconsole.log('Token data: ',tokenData);" +
    webpackCode +
    "\n</script>\n<style>\nhtml, body {\nmargin: 0;\npadding: 0;\nheight: 100vh;\noverflow: hidden;\n}\ndiv {\nresize: both;\noverflow: auto;\n}\nh1 {\nvisibility: hidden;\n}</style>\n</body>\n</html>\n";

  return finalString;
}

export async function buildAnimationFiles() {
  let tokenData = {
    tokenHash: "",
    tokenId: "",
    projectName: "",
    artistName: "",
    properties: "",
    toData: "",
  };

  const webpackCode = await fs.promises.readFile(
    "./build/1-project-bundle/main.js"
  );
  let propertyString = '{"placeholder": "here"}'; // will be replaced later
  let toDataString = '{"placeholder": "here"}';

  for (let i = 0; i < projectInfo.numberOfEditions; i++) {
    tokenData.tokenHash = getTokenHash();
    tokenData.tokenId = getTokenId(i);
    let tokenString =
      'let tokenData = {\n"tokenHash": "0x' + tokenData.tokenHash + '",\n';
    tokenString += `"tokenId": "${tokenData.tokenId}",\n`;
    tokenString += `"projectName": "${projectInfo.projectName}",\n`;
    tokenString += `"artistName": "${projectInfo.artistName}",\n`;
    tokenString += `"properties": ${propertyString},\n`;
    tokenString += `"toData": ${toDataString}\n}\n`;
    let finalString =
      animStrings.part1 +
      projectInfo.titleForViewport +
      animStrings.part2 +
      tokenString +
      animStrings.part3 +
      webpackCode +
      animStrings.part4;
    //    console.log(finalString);
    await fs.promises.writeFile(
      `./build/2-anim-files/${tokenData.tokenId}.html`,
      finalString,
      (err) => {
        if (err) {
          console.error(err, +" on file " + i);
        }
        console.log("Animation File " + i + " written successfully.");
      }
    );
  }
}

export async function capturePreviewImages() {
  for (let i = 0; i < projectInfo.numberOfEditions; i++) {
    let tokenId = getTokenId(i);
    let animFileName = `./build/2-anim-files/${tokenId}.html`;
    let imageFileName = `./build/3-anim-images/${tokenId}.png`;
    const markup = fs.readFileSync(animFileName).toString();
    await nodeHtmlToImage({
      output: imageFileName,
      html: markup,
      puppeteerArgs: { defaultViewport: { width: 700, height: 700 } },
    }).then(() => {
      console.log(`Preview image ${i} was created successfully!`);
    });
  }
}

export async function pinImagesAndAnims() {
  let imageString = `{"images": [`;
  let animString = `{"anims": [`;
  for (let i = 0; i < projectInfo.numberOfEditions; i++) {
    let tokenId = getTokenId(i);
    let imageFileName = `./build/3-anim-images/${tokenId}.png`;
    let animFileName = `./build/2-anim-files/${tokenId}.html`;
    let imageOptions = {
      pinataMetadata: {
        name: projectInfo.projectName,
        keyvalues: {
          tokenId: tokenId,
          item: "Token preview png file",
        },
      },
      pinataOptions: {
        cidVersion: 1,
      },
    };
    console.log(imageFileName);
    await pinata.pinFromFS(imageFileName, imageOptions).then((res) => {
      imageString += `{"token": "${tokenId}", "ipfs": "https://ipfs.io/ipfs/${res.IpfsHash}"}`;
      imageIPFS.push(
        `{"token": "${tokenId}", "ipfs": "https://ipfs.io/ipfs/${res.IpfsHash}"}`
      );

      if (i < projectInfo.numberOfEditions - 1) {
        imageString += `,`;
      }
    });
    let animOptions = {
      pinataMetadata: {
        name: projectInfo.projectName,
        keyvalues: {
          tokenId: tokenId,
          item: "Animation html file",
        },
      },
      pinataOptions: {
        cidVersion: 1,
      },
    };
    await pinata.pinFromFS(animFileName, animOptions).then((res) => {
      animString += `{"token": "${tokenId}", "ipfs": "https://ipfs.io/ipfs/${res.IpfsHash}"}`;
      animIPFS.push(
        `{"token": "${tokenId}", "ipfs": "https://ipfs.io/ipfs/${res.IpfsHash}"}`
      );
      if (i < projectInfo.numberOfEditions - 1) {
        animString += `,`;
      }
    });
  }
  imageString += `]}`;
  animString += `]}`;
  finalProjectJSON += `${imageString}, ${animString},`;
}

export async function buildFinalMetaAndPinToIPFS() {
  for (let i = 0; i < projectInfo.numberOfEditions; i++) {
    let tokenId = getTokenId(i);
    let finalMeta = `{"image": "${
      JSON.parse(imageIPFS[i]).ipfs
    }","background_color": "96231B","external_url": "https://mact6340-app-nzv3s.ondigitalocean.app/projects","description": "${
      projectInfo.tokenDescriptionText
    }","name": "${projectInfo.openSeaCollectionName}","animation_url": "${
      JSON.parse(animIPFS[i]).ipfs
    }"}`;
    let finalMetaFileName = `./build/4-completed-metadata/${tokenId}.json`;
    await fs.promises.writeFile(finalMetaFileName, finalMeta, (err) => {
      if (err) {
        console.error(err, +" on file " + i);
      }
    });
  }
  let finalMetaString = `{"metas": [`;
  for (let i = 0; i < projectInfo.numberOfEditions; i++) {
    let tokenId = getTokenId(i);
    let finalMetaFileName = `./build/4-completed-metadata/${tokenId}.json`;
    let finalMetaOptions = {
      pinataMetadata: {
        name: projectInfo.projectName,
        keyvalues: {
          tokenId: tokenId,
          item: "Token metadata file",
        },
      },
      pinataOptions: {
        cidVersion: 1,
      },
    };
    await pinata.pinFromFS(finalMetaFileName, finalMetaOptions).then((res) => {
      finalMetaString += `{"token": "${tokenId}", "ipfs":  "https://ipfs.io/ipfs/${res.IpfsHash}"}`;
      finalMetaIPFS.push(
        `{"token": "${tokenId}", "ipfs":  "https://ipfs.io/ipfs/${res.IpfsHash}"}`
      );
      if (i < projectInfo.numberOfEditions - 1) {
        finalMetaString += `,`;
      }
    });
  }
  finalMetaString += `]}`;
  console.log(finalMetaString);
  finalProjectJSON += `${finalMetaString},`;
}

export async function buildProjectMetaAndPinToIPFS() {
  let projectMetaString = `{"project-image": "https://gateway.pinata.cloud/ipfs/${imageIPFS[0].ipfs}", "project-meta": `;
  let projectMeta =
    "" +
    `{"name": "${projectInfo.openSeaCollectionName}","description": "${projectInfo.openSeaCollectionDescription}","image": "https://ipfs.io/ipfs/${imageIPFS[0].ipfs}","external_link": "https://mact6340-app-nzv3s.ondigitalocean.app/projects","seller_fee_basis_points":"${projectInfo.openSeaCollectionSeller_fee_basis_points}","fee_recipient": "${projectInfo.openSeaCollectionFee_recipient}"}`;
  let projectMetaFileName = `./build/4-completed-metadata/${projectInfo.projectName
    .replace(/ /g, "_")
    .toLowerCase()}.json`;
  await fs.promises.writeFile(projectMetaFileName, projectMeta, (err) => {
    if (err) {
      console.error(err, +" on writing file ");
    }
  });

  let projectMetaOptions = {
    pinataMetadata: {
      name: projectInfo.projectName,
      keyvalues: {
        item: "Collection metadata file",
      },
    },
    pinataOptions: {
      cidVersion: 1,
    },
  };
  projectMetaIPFS = await pinata
    .pinFromFS(projectMetaFileName, projectMetaOptions)
    .then((res) => {
      projectMetaString += `"https://ipfs.io/ipfs/${res.IpfsHash}"}`;
    });
  finalProjectJSON += `${projectMetaString}]}`;
  await fs.promises.writeFile(
    `./build/5-final-project-data/finalProjectData.json`,
    finalProjectJSON,
    (err) => {
      if (err) {
        console.error(err, +" on file " + i);
      }
    }
  );
  console.log(finalProjectJSON);
}

export async function buildScriptsForDatabase() {
  // add project to db script
  // activate project script

  let addProjectScriptString = `INSERT INTO projects (
project_name,
img_url,
project_description,
quantity,
price_eth,
open_date_gmt,
royalty_percent,
active
)
VALUES (
'${projectInfo.projectName}',
'https://ipfs.io/ipfs/${imageIPFS[0].ipfs}',
'${projectInfo.websiteProjectDescription}',
${projectInfo.numberOfEditions},
${projectInfo.price},
${projectInfo.releaseDate},
${projectInfo.royaltiesPercent},
0
);
`;
  let addScriptFileName = `./build/5-final-project-data/addNewProject.sql`;
  await fs.promises.writeFile(
    addScriptFileName,
    addProjectScriptString,
    (err) => {
      if (err) {
        console.error(err, +" on file " + i);
      }
    }
  );

  let activateProjectScriptString = `UPDATE projects SET active = 1 WHERE project_name = '${projectInfo.projectName}';`;
  let activateProjectScriptFileName = `./build/5-final-project-data/activateNewProject.sql`;
  await fs.promises.writeFile(
    activateProjectScriptFileName,
    activateProjectScriptString,
    (err) => {
      if (err) {
        console.error(err, +" on file " + i);
      }
    }
  );
}

export async function deployContract() {}

function getTokenId(iter) {
  let s = iter + "";
  while (s.length < 16) s = "0" + s;
  return s;
}

function getTokenHash() {
  let hashVal = new Date().getTime(); // seed for randomness
  const rand = function () {
    //https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32
    let t = (hashVal += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let h =
    "" +
    Array(16)
      .fill(0)
      .map((_) => "0123456789abcdef"[(rand() * 16) | 0])
      .join("");
  return h;
}
