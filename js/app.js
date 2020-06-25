
var config = {
  userPoolRegion: 'us-west-2',
  userPoolId: 'us-west-2_jKbmFSAtP',
  clientId: '4bm64prfamvrt5s563cqirmq9',
  domain: 'uacap-timescape.auth.us-west-2.amazoncognito.com',
  signinRedirect: 'https://test.timescape.arizona.edu/index.html'
};

function initCognitoSDK() {
  var authData = {
    ClientId: config.clientId,
    AppWebDomain: config.domain,
    TokenScopesArray: ['openid', 'profile', 'email', 'phone'],
    RedirectUriSignIn: config.signinRedirect,
    RedirectUriSignOut: 'https://test.timescape.arizona.edu/'
  };
  var auth = new AmazonCognitoIdentity.CognitoAuth(authData);
  auth.userhandler = {
    onSuccess: function(result) {
      console.log('Sign in success', result);
    },
    onFailure: function(error) {
      console.error('Sign in error', error);
    }
  };
  // The default response_type is "token", uncomment the next line to make it be "code" instead.
  // auth.useCodeGrantFlow();
  return auth;
}
// Perform user operations.
function login() {
  var state = $('#loginLink').innerHTML;
  if (state === "Sign Out") {
    $('loginLink').innerHTML = "Sign In";
    auth.signOut();
    clearTokens();
  } else {
    auth.getSession();
  }
}

function currentSession() {
  var session = auth.getSignInUserSession();
  // the actual user
  var idToken = session.getIdToken().getJwtToken();
  if (idToken) {
    var payload = idToken.split('.')[1];
    var formatted = JSON.parse(atob(payload));
    console.log('Id Token Info', formatted);
  }
  var accessToken = session.getAccessToken().getJwtToken();
  if (accessToken) {
    var payload = accessToken.split('.')[1];
    var formatted = JSON.parse(atob(payload));
    console.log('Access Token Info', formatted);
  }
  var refreshToken = session.getRefreshToken().getToken();
  if (refreshToken) {
    var payload = refreshToken.split('.')[1];
    var formatted = JSON.parse(atob(payload));
    console.log('Refresh Token Info', formatted);
  }
}



