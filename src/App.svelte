<script>
  // change to cause build.
  import UAHeader from "./UAHeader.svelte";
  import NotPermitted from "./NotPermitted.svelte";
  import IV from "./IndividualVis.svelte";
  import {assignThreshold} from "./algos.js"
  import { onMount } from "svelte";
  import { wifiData } from "./store.js";
  let auth, signInButton, signInHolder, introText;
  //Teresa Portela's auth functions
  function initCognitoSDK() {
    //
    var authData = {
      ClientId: "4qkpam1nldvol9i736l6fvbnu9", // Your client id here
      AppWebDomain: "uacap-prd-domain.auth.us-west-2.amazoncognito.com/", // Exclude the "https://" part.
      TokenScopesArray: ["openid", "profile", "email", "phone"],
      RedirectUriSignIn: "https://memoryjog.timescape.arizona.edu/index.html",
      RedirectUriSignOut: "https://shibboleth.arizona.edu/cgi-bin/logout.pl",
      userPoolId: "us-west-2_9zt4gLEaV"
    };
    var auth = new AmazonCognitoIdentity.CognitoAuth(authData);
    // You can also set state parameter
    // auth.setState(<state parameter>);
    auth.userhandler = {
      onSuccess: function(result) {
        //remove the removable elements
        for (let e of document.querySelectorAll(".removable")) {
          e.remove();
        }
        console.log("Sign in success", auth);
        console.log("auth is " + JSON.stringify(auth));
        var cognitoUser = auth.getSignInUserSession();
        var token = cognitoUser.idToken.jwtToken;
        console.log("username is " + cognitoUser);
        console.log("token is" + token);
        currentSession(auth);
        const Url =
          "https://0bx58bg6ib.execute-api.us-west-2.amazonaws.com/prd/retrieveReport";
        signInButton.style.color = "white";
        signInHolder.style.position = "absolute";
        signInHolder.style.right = "10px";
        signInHolder.style.top = "20px";
        signInHolder.style.margin = "0px";
        // converted fetch from ajax code
        fetch(Url, {
          headers: {
            Authorization: token,
            "Content-Type": "application/json"
          }
        })
          .then(res => res.json())
          .then(jsonData => {
            // load the individual visualizations at this point
            //remove everything except the signout
            // properly format data for vis
            // issue with data being string still? this seems intermittent,
            if (typeof "" === typeof jsonData) {
              jsonData = JSON.parse(jsonData);
            }
            console.log("json data is ", jsonData);
            console.log("type of json data ", typeof jsonData);
            jsonData = jsonData.map(e => {
              e = e.eventData;
              e._time = e._time * 1000;
              return e;
            });
            // bump up the times less than 5 mins
            assignThreshold(jsonData)
            new IV({
              target: document.body,
              props: {
                reportData: jsonData
              }
            });
            wifiData.set(jsonData);
          })
          .catch(e => {
            console.log("error", e);
            //remove the removable elements
            for (let e of document.querySelectorAll(".removable")) {
              e.remove();
            }
            // load the missing data page
            new NotPermitted({
              target: document.body,
              props: {
                reason: "nodata"
              }
            });
          });
      },
      onFailure: function(error) {
        console.error("Sign in error", error);
        console.log(error);
        signInHolder.remmove();
        new NotPermitted({
          target: document.body,
          props: {
            reason: "Sign in error"
          }
        });
      }
    };
    // The default response_type is "token", uncomment the next line will make it be "code".
    // auth.useCodeGrantFlow();
    return auth;
  }
  function userButton(auth) {
    var state = signInButton.innerHTML;
    if (state === "Sign Out") {
      signInButton.innerHTML = "Sign In";
      // enssssure that we set up the auth page again
      // prevent auto loading the map

      document.cookie = "gotovis=false";
      //replace the history to remove the access token even on back
      if (document.querySelector("#secondVisHolder")) {
        document.querySelector("#secondVisHolder").remove();
      }
      if (document.querySelector("#holder")) {
        document.querySelector("#holder").remove();
      }
      if (document.querySelector("#signin")) {
document.querySelector("#signin").remove()
      }
      let newURl = `${window.location}`;
      window.history.replaceState({}, "", newURl.replace(/index.*/, ""));
      new NotPermitted({
        target: document.body,
        props: {
          reason: "user is signed out, close Tab or reload page."
        }
      });
      //add a notpermitted page with the reason "you are logged out"
      setTimeout(() => {
        auth.signOut({ global: true });
      }, 3000);
    } else {
      auth.getSession();
    }
  }

  // Operations when signed in.
  function currentSession(auth) {
    signInButton.innerHTML = "Sign Out";
    var session = auth.getSignInUserSession();
    // the actual user
    var idToken = session.getIdToken().getJwtToken();
    if (idToken) {
      var payload = idToken.split(".")[1];
      var tokenobj = JSON.parse(atob(payload));
      var formatted = JSON.stringify(tokenobj, undefined, 2);
      console.log("Id Token Info", formatted);
    }
    var accessToken = session.getAccessToken().getJwtToken();
    if (accessToken) {
      var payload = accessToken.split(".")[1];
      var tokenobj = JSON.parse(atob(payload));
      var formatted = JSON.stringify(tokenobj, undefined, 2);
      console.log("Access Token Info", formatted);
    }
    var refreshToken = session.getRefreshToken().getToken();
    if (refreshToken) {
      var payload = refreshToken.split(".")[1];
      var formatted = JSON.parse(atob(payload));
      console.log("Refresh Token Info", formatted);
    }
  }

  onMount(() => {
    auth = initCognitoSDK();
    signInButton.addEventListener("click", () => {
      userButton(auth);
    });
    auth.parseCognitoWebResponse(window.location.href);
  });
</script>

<style>
  #small {
    font-size: 12px;
  }
  #title {
    margin: 10%;
  }
  #summary {
    width: 80%;
    margin: 0 auto;
  }
  #signin {
    margin: 5%;
  }
</style>

<UAHeader />
<div bind:this={introText} class="removable">
  <div id="Title">
    <h1>UA Timescape</h1>
  </div>
  <div id="summary">
    <p>
      Minimizing exposure to the novel coronavirus is key to protecting UArizona
      students, faculty and staff from COVID-19. This site has been created to
      support strategic efforts related to crowd density, managing campus
      spaces, mitigating spread, and learning about risk factors.
    </p>
    <p>You will need authorization to log in to this site using your NetID.</p>
  </div>

</div>
<div id="signin" bind:this={signInHolder}>
  <a bind:this={signInButton}>Sign In</a>
</div>
<div id="contact" class="removable">
  <p id="small">For questions, please contact: uacap@list.arizona.edu</p>
</div>
