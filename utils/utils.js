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
);
import pkg from "hardhat";
const { ethers, run, network } = pkg;

("use strict");

let webpackCode = "";
let finalProjectJSON = `{"project": "${projectInfo.projectName}",\n"elements":[\n`;
let imageIPFS = [];
let animIPFS = [];
let finalMetaIPFS = [];
let projectMetaIPFS = "";
let contractAddress = "";
let projectImageIPFS = "";

export async function completeBuildAndDeploySequence() {
  let seq1 = [
    buildAnimationFiles,
    capturePreviewImages,
    pinImagesAndAnims,
    buildFinalMetaAndPinToIPFS,
    buildProjectMetaAndPinToIPFS,
    deployContract,
    buildScriptsForDatabase,
  ];
  for (const fn of seq1) await fn();
}

export async function getIframeString(hash) {
  try {
    webpackCode = await fs.promises.readFile(
      "./build/1-project-bundle/main.js"
    );
    console.log("Webpack code successfully read.");
  } catch (err) {
    console.error(err);
  }
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
  console.log("\nBuilding animation files...");
  let tokenData = {
    tokenHash: "",
    tokenId: "",
    projectName: "",
    artistName: "",
    properties: "",
    toData: "",
  };

  let propertyString = '{"placeholder": "here"}'; // will be replaced later
  let toDataString = '{"placeholder": "here"}';

  for (let i = 0; i < projectInfo.numberOfEditions; i++) {
    tokenData.tokenHash = getTokenHash();
    tokenData.tokenId = i + 1; //getTokenId(i);
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
    try {
      fs.writeFileSync(
        `./build/2-anim-files/${tokenData.tokenId}.html`,
        finalString
      );
      console.log(`Animation File ${i + 1} written successfully.`);
    } catch (err) {
      console.error(err);
    }
  }
}

export async function capturePreviewImages() {
  console.log("\nCapturing preview images...");
  for (let i = 0; i < projectInfo.numberOfEditions; i++) {
    let tokenId = i + 1; //getTokenId(i);
    let animFileName = `./build/2-anim-files/${tokenId}.html`;
    let imageFileName = `./build/3-anim-images/${tokenId}.png`;
    const markup = fs.readFileSync(animFileName).toString();
    await nodeHtmlToImage({
      output: imageFileName,
      html: markup,
      puppeteerArgs: { defaultViewport: { width: 700, height: 700 } },
    }).then(() => {
      console.log(`Preview image ${i + 1} was created successfully!`);
    });
  }
}

export async function pinImagesAndAnims() {
  console.log("\nPinning animation files and preview images to IPFS...");
  let imageString = `{\n"images": [\n`;
  let animString = `{\n"anims": [\n`;
  for (let i = 0; i < projectInfo.numberOfEditions; i++) {
    let tokenId = i + 1; //getTokenId(i);
    let animFileName = `./build/2-anim-files/${tokenId}.html`;
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
        animString += `,\n`;
      } else {
        animString += `\n`;
      }
    });
    let imageFileName = `./build/3-anim-images/${tokenId}.png`;
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
    await pinata.pinFromFS(imageFileName, imageOptions).then((res) => {
      imageString += `{"token": "${tokenId}", "ipfs": "https://ipfs.io/ipfs/${res.IpfsHash}"}`;
      imageIPFS.push(
        `{"token": "${tokenId}", "ipfs": "https://ipfs.io/ipfs/${res.IpfsHash}"}`
      );
      if (i == 0) {
        projectImageIPFS = `https://ipfs.io/ipfs/${res.IpfsHash}`;
      }
      if (i < projectInfo.numberOfEditions - 1) {
        imageString += `,\n`;
      } else {
        imageString += `\n`;
      }
    });
  }
  animString += `]}\n`;
  imageString += `]}\n`;
  finalProjectJSON += `${imageString},\n ${animString},\n`;
  console.log(animString);
  console.log(imageString);
  console.log("Anim array:");
  console.log(...animIPFS);
  console.log("Image array:");
  console.log(...imageIPFS);
}

export async function buildFinalMetaAndPinToIPFS() {
  console.log("\nBuilding token metadata files and pinning to IPFS...");
  for (let i = 0; i < projectInfo.numberOfEditions; i++) {
    let tokenId = i + 1; //getTokenId(i);
    let finalMeta = `{\n  "image": "${
      JSON.parse(imageIPFS[i]).ipfs
    }",\n  "background_color": "96231B",\n  "external_url": "https://mact6340-app-nzv3s.ondigitalocean.app/projects",\n  "description": "${
      projectInfo.tokenDescriptionText
    }",\n  "name": "${
      projectInfo.openSeaCollectionName
    }",\n  "animation_url": "${JSON.parse(animIPFS[i]).ipfs}"\n}`;
    let finalMetaFileName = `./build/4-completed-metadata/${tokenId}.json`;
    try {
      fs.writeFileSync(finalMetaFileName, finalMeta);
      console.log(`Metafile ${i + 1} written successfully.`);
    } catch (err) {
      console.error(err);
    }
  }
  let finalMetaString = `{\n"metas": [\n`;
  for (let i = 0; i < projectInfo.numberOfEditions; i++) {
    let tokenId = i + 1; //getTokenId(i);
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
      finalMetaString += `{\n  "token": "${tokenId}",\n  "ipfs":  "https://ipfs.io/ipfs/${res.IpfsHash}"\n}\n`;
      finalMetaIPFS.push(
        `{"token": "${tokenId}", "ipfs":  "https://ipfs.io/ipfs/${res.IpfsHash}"}`
      );
      if (i < projectInfo.numberOfEditions - 1) {
        finalMetaString += `,`;
      }
    });
  }
  finalMetaString += `]\n}`;
  console.log(finalMetaString);
  finalProjectJSON += `${finalMetaString},`;
}

export async function buildProjectMetaAndPinToIPFS() {
  console.log("\nBuilding project metadata file and pinning to IPFS...");
  let projectMetaString = `{\n"project-image": "${projectImageIPFS}",\n"project-meta": `;
  let projectMeta =
    "" +
    `{\n  "name": "${projectInfo.openSeaCollectionName}",\n  "description": "${projectInfo.openSeaCollectionDescription}",\n  "image": "https://ipfs.io/ipfs/${imageIPFS[0].ipfs}",\n  "external_link": "https://mact6340-app-nzv3s.ondigitalocean.app/projects",\n  "seller_fee_basis_points":"${projectInfo.openSeaCollectionSeller_fee_basis_points}",\n  "fee_recipient": "${projectInfo.openSeaCollectionFee_recipient}"\n}\n`;
  let projectMetaFileName = `./build/4-completed-metadata/${projectInfo.projectName
    .replace(/ /g, "_")
    .toLowerCase()}.json`;
  try {
    fs.writeFileSync(projectMetaFileName, projectMeta);
    console.log(`Project metadata file written successfully.`);
  } catch (err) {
    console.error(err);
  }
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
  await pinata
    .pinFromFS(projectMetaFileName, projectMetaOptions)
    .then((res) => {
      projectMetaString += `"https://ipfs.io/ipfs/${res.IpfsHash}"\n}\n`;
      projectMetaIPFS = `"https://ipfs.io/ipfs/${res.IpfsHash}"}`;
    });
  finalProjectJSON += `${projectMetaString}\n]\n}\n`;
  let finalProjectFileName = `./build/5-final-project-data/finalProjectData.json`;
  try {
    fs.writeFileSync(finalProjectFileName, finalProjectJSON);
    console.log("Final Project summary file written to: ");
    console.log(finalProjectFileName + "\n");
  } catch (err) {
    console.error(err);
  }
  console.log(projectMetaString);
  console.log("Saved project summary file to:");
  console.log(finalProjectFileName);
}

export async function deployContract() {
  console.log("\nDeploying contract...");
  await deploy().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

async function deploy() {
  let priceString = Math.floor(
    projectInfo.price * 10000 * 10000 * 10000 * 10000 * 100
  ).toString();
  const args = {
    mint_price: priceString,
    max_tokens: projectInfo.numberOfEditions,
    base_uri: projectMetaIPFS,
    royaltyArtist: projectInfo.openSeaCollectionFee_recipient,
    royaltyBasis: projectInfo.openSeaCollectionSeller_fee_basis_points,
  };
  const courseNFTContractFactory = await ethers.getContractFactory(
    "CourseNFTContract"
  );
  const courseNFTContract = await courseNFTContractFactory.deploy(
    args.mint_price,
    args.max_tokens,
    args.base_uri,
    args.royaltyArtist,
    args.royaltyBasis
  );
  // deploy
  await courseNFTContract.waitForDeployment(
    args.mint_price,
    args.max_tokens,
    args.base_uri,
    args.royaltyArtist,
    args.royaltyBasis
  );
  console.log("Waiting for block verifications...");
  await courseNFTContract.deploymentTransaction().wait(30);
  contractAddress = await courseNFTContract.getAddress();
  console.log(`Contract deployed to ${contractAddress}`);
  // verify
  if (
    // we are on a live testnet and have the correct api key
    (network.config.chainId === 80001 && process.env.POLYGONSCAN_API_KEY) ||
    (network.config.chainId === 1115511 && process.env.ETHERSCAN_API_KEY)
  ) {
    await verify(contractAddress, [
      args.mint_price,
      args.max_tokens,
      args.base_uri,
      args.royaltyArtist,
      args.royaltyBasis,
    ]);
    console.log("Completed.");
  } else {
    console.log("No verification available for hardhat network.");
  }
}

async function verify(contractAddress, args) {
  console.log("verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (err) {
    if (err.message.toLowerCase().includes("already verified")) {
      console.log("Already verified");
    } else {
      console.log(err);
    }
  }
}

export async function buildScriptsForDatabase() {
  console.log(
    "Building mySQL scripts for adding and activating project in database."
  );
  let addProjectScriptString = `INSERT INTO projects (
project_name,
img_url,
project_description,
quantity,
price_eth,
open_date_gmt,
royalty_percent,
active,
contractAddress,
summaryData
)
VALUES (
'${projectInfo.projectName}',
'${projectImageIPFS}',
'${projectInfo.websiteProjectDescription}',
${projectInfo.numberOfEditions},
${projectInfo.price},
${projectInfo.releaseDate},
${projectInfo.royaltiesPercent},
0,
'${contractAddress}',
'${finalProjectJSON}'
);
`;
  let addScriptFileName = `./build/5-final-project-data/addNewProject.sql`;
  fs.writeFileSync(addScriptFileName, addProjectScriptString, (err) => {
    if (err) {
      console.error(err, +" on file " + i);
    }
  });

  let activateProjectScriptString = `UPDATE projects SET active = 1 WHERE project_name = '${projectInfo.projectName}';`;
  let activateProjectScriptFileName = `./build/5-final-project-data/activateNewProject.sql`;
  fs.writeFileSync(
    activateProjectScriptFileName,
    activateProjectScriptString,
    (err) => {
      if (err) {
        console.error(err, +" on file " + i);
      }
    }
  );
  console.log("Scripts saved to:");
  console.log(addScriptFileName);
  console.log(activateProjectScriptFileName);
}

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
