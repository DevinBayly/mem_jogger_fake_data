<script>
  //
  import UAHeader from "./UAHeader.svelte";
  import IV from "./IndividualVis.svelte"
  import { onMount } from "svelte";
  import {wifiData} from "./store.js"
  let auth, signInButton;
  //Teresa Portela's auth functions
  function initCognitoSDK() {
		var authData = {
			ClientId : '4bm64prfamvrt5s563cqirmq9', // Your client id here
			AppWebDomain : 'uacap-timescape.auth.us-west-2.amazoncognito.com', // Exclude the "https://" part. 
            TokenScopesArray: ['openid', 'profile', 'email', 'phone'],
			RedirectUriSignIn : 'https://test.timescape.arizona.edu/index.html',
			RedirectUriSignOut : 'https://test.timescape.arizona.edu/',
            userPoolId: 'us-west-2_jKbmFSAtP'
		};
		var auth = new AmazonCognitoIdentity.CognitoAuth(authData);
		// You can also set state parameter 
		// auth.setState(<state parameter>);  
        auth.userhandler = {
        onSuccess: function(result) {
			console.log('Sign in success', auth);
			console.log('auth is ' + JSON.stringify(auth));
			var cognitoUser = auth.getSignInUserSession();
		    var token = cognitoUser.idToken.jwtToken;
			console.log('username is ' + cognitoUser);
			console.log('token is' + token);
			currentSession(auth)
            const Url = 'https://60p8vnvhle.execute-api.us-west-2.amazonaws.com/tst/retrieveReport'
            // converted fetch request from the ajax code
            fetch(Url,{
                headers:{
                    "Authorization":token,
                    "Content-Type":"application/json",
                }
            }).then(res=> res.json()).then(j=> {
                // load the individual visualizations at this point
                wifiData.set(j)

            }).catch(e=> {
                console.log("error",e)
            })
            /*
			$.ajax({
			    url: Url,
			    dataType: 'json',
		        contentType: 'application/json',
		        beforeSend: function(request) {
			      request.setRequestHeader("Authorization", token);
			    },
		        success: function(result) {
                    console.log(result);
                    // here's where I'll call the individual visualization
			        //document.getElementById('lambdaResponse').innerHTML = result
			     },
			    error: function(xhr, textStatus, error) {
			      console.log('API ERROR', error);
			      console.log(textStatus, xhr);
	            }
            });
            */


        },
        onFailure: function(error) {
			console.error('Sign in error', error);
			console.log(error);
			showSignedOut()
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
      auth.signOut();
      clearTokens();
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
			var payload = idToken.split('.')[1];
			var tokenobj = JSON.parse(atob(payload));
			var formatted = JSON.stringify(tokenobj, undefined, 2);
		    console.log('Id Token Info', formatted);

		  }
		  var accessToken = session.getAccessToken().getJwtToken();
		  if (accessToken) {
			var payload = accessToken.split('.')[1];
			var tokenobj = JSON.parse(atob(payload));
			var formatted = JSON.stringify(tokenobj, undefined, 2);
		    console.log('Access Token Info', formatted);
		  }
		  var refreshToken = session.getRefreshToken().getToken();
		  if (refreshToken) {
		    var payload = refreshToken.split('.')[1];
		    var formatted = JSON.parse(atob(payload));
		    console.log('Refresh Token Info', formatted);
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

<UAHeader />
<div id="Title">
  <h1>UA Timescape</h1>
</div>
<div id="summary">
  <p>
    Using wifi network information to combat the spread of the Corona Virus
    during the COVID-19 Pandemic
  </p>
</div>

<div id="signin">
  <a bind:this={signInButton}>Sign In</a>
</div>
