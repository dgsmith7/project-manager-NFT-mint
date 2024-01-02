("use stict");

(() => {
  //let parentTokenData = {};
  // document.querySelector("#make-anims-button").addEventListener("click", () => {
  //   launchAnimBuilder();
  // });

  // document.querySelector("#get-images-button").addEventListener("click", () => {
  //   launchImageCapture();
  // });

  // document
  //   .querySelector("#pin-images-and-anims-button")
  //   .addEventListener("click", () => {
  //     launchImageAndAnimPinning();
  //   });

  // document
  //   .querySelector("#build-and-pin-final-metas")
  //   .addEventListener("click", () => {
  //     launchFinalMetaBuildAndPin();
  //   });

  // document
  //   .querySelector("#build-and-pin-project-meta")
  //   .addEventListener("click", () => {
  //     launchProjectMetaBuildAndPin();
  //   });

  document.body.onload = () => {
    populateProjectData();
  };

  document.querySelector("#keep-hash").addEventListener("click", () => {
    let h = document.querySelector("#hash-display").innerHTML;
    console.log(h);
    document
      .querySelector("#preview-frame")
      .setAttribute("src", "/iframe?hash=" + h);
  });

  document.querySelector("#new-hash").addEventListener("click", () => {
    let h =
      "" +
      Array(16)
        .fill(0)
        .map((_) => "0123456789abcdef"[(Math.random() * 16) | 0])
        .join("");
    console.log(h);
    document
      .querySelector("#preview-frame")
      .setAttribute("src", "/iframe?hash=" + h);
    document.querySelector("#hash-display").innerHTML = h;
  });

  document
    .querySelector("#build-sequence-button")
    .addEventListener("click", () => {
      document.querySelector("#build-sequence-button").disabled = true;
      document.querySelector("#build-sequence-button").style.visibility =
        "hidden";
      launchBuildSequence();
    });

  // document.querySelector("#preview-frame").addEventListener("load", () => {
  //   let td = window.frames["preview-frame"].contentWindow.tokenData;
  //   parentTokenData = td;
  //   console.log(td);
  // });

  // function launchAnimBuilder() {
  //   fetch("/build-anims", {
  //     method: "POST",
  //     headers: {
  //       "Content-type": "application/json",
  //     },
  //   })
  //     .then((r) => r.json())
  //     .then((response) => {
  //       document.querySelector("#anim-button-response").innerHTML =
  //         response.result;
  //     })
  //     .then(() => {
  //       setTimeout(() => {
  //         document.querySelector("#anim-button-response").innerHTML = "";
  //       }, "5000");
  //     })
  //     .catch((err) => {
  //       console.log("We were unable to build animations - ", err);
  //     });
  // }

  // function launchImageCapture() {
  //   fetch("/capture-images", {
  //     method: "POST",
  //     headers: {
  //       "Content-type": "application/json",
  //     },
  //   })
  //     .then((r) => r.json())
  //     .then((response) => {
  //       document.querySelector("#images-button-response").innerHTML =
  //         response.result;
  //     })
  //     .then(() => {
  //       setTimeout(() => {
  //         document.querySelector("#images-button-response").innerHTML = "";
  //       }, "5000");
  //     })
  //     .catch((err) => {
  //       console.log("We were unable to build animations - ", err);
  //     });
  // }

  // function launchImageAndAnimPinning() {
  //   fetch("/pin-images-and-anims", {
  //     method: "POST",
  //     headers: {
  //       "Content-type": "application/json",
  //     },
  //   })
  //     .then((r) => r.json())
  //     .then((response) => {
  //       document.querySelector("#pin-button-response").innerHTML =
  //         response.result;
  //     })
  //     .then(() => {
  //       setTimeout(() => {
  //         document.querySelector("#pin-button-response").innerHTML = "";
  //       }, "5000");
  //     })
  //     .catch((err) => {
  //       console.log("We were unable to pin images and animations - ", err);
  //     });
  // }

  // function launchFinalMetaBuildAndPin() {
  //   fetch("/build-and-pin-final-metas", {
  //     method: "POST",
  //     headers: {
  //       "Content-type": "application/json",
  //     },
  //   })
  //     .then((r) => r.json())
  //     .then((response) => {
  //       document.querySelector("#finals-pin-button-response").innerHTML =
  //         response.result;
  //     })
  //     .then(() => {
  //       setTimeout(() => {
  //         document.querySelector("#finals-pin-button-response").innerHTML = "";
  //       }, "5000");
  //     })
  //     .catch((err) => {
  //       console.log("We were unable to pin images and animations - ", err);
  //     });
  // }

  // function launchProjectMetaBuildAndPin() {
  //   fetch("/build-and-pin-project-metas", {
  //     method: "POST",
  //     headers: {
  //       "Content-type": "application/json",
  //     },
  //   })
  //     .then((r) => r.json())
  //     .then((response) => {
  //       document.querySelector("#project-pin-button-response").innerHTML =
  //         response.result;
  //     })
  //     .then(() => {
  //       setTimeout(() => {
  //         document.querySelector("#project-pin-button-response").innerHTML = "";
  //       }, "5000");
  //     })
  //     .catch((err) => {
  //       console.log("We were unable to pin images and animations - ", err);
  //     });
  // }

  function launchBuildSequence() {
    fetch("/build-sequence", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
    })
      .then(() => {
        document.querySelector("#build-sequence-button-response").innerHTML =
          response.result;
        document.querySelector("#project-meta-display").innerHTML =
          response.result;
      })
      .then(() => {
        setTimeout(() => {
          document.querySelector("#build-sequence-button-response").innerHTML =
            "";
        }, "5000");
      })
      .catch((err) => {
        console.log("We were unable to complete build sequence - ", err);
      });
  }

  function populateProjectData() {
    fetch("/get-project-data", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
    })
      .then((r) => r.json())
      .then((res) => {
        console.log("this is it:", res);
        document.querySelector("#project-name-holder").innerHTML =
          res.projectName;
        document.querySelector("#project-desc-holder").innerHTML =
          res.websiteProjectDescription;
        document.querySelector("#project-price-holder").innerHTML = res.price;
        document.querySelector("#project-quantity-holder").innerHTML =
          res.numberOfEditions;
        document.querySelector("#project-date-holder").innerHTML =
          res.releaseDate;
        document.querySelector("#project-roylaties-holder").innerHTML =
          res.royaltiesPercent;
        document.querySelector("#artist-wallet-holder").innerHTML =
          res.artistsPayoutWallet;
        document.querySelector("#royalty-wallet-holder").innerHTML =
          res.openSeaCollectionFee_recipient;
        document.querySelector("#viewport-name-holder").innerHTML =
          res.titleForViewport;
        document.querySelector("#collection-name-holder").innerHTML =
          res.openSeaCollectionName;
        document.querySelector("#collection-desc-holder").innerHTML =
          res.openSeaCollectionDescription;
        document.querySelector("#token-desc-holder").innerHTML =
          res.tokenDescriptionText;
      })
      .catch((err) => {
        console.log("We were unable to get project info - ", err);
      });
  }
})();
