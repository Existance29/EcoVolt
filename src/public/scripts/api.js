//functions for CRUD api calls

const accessToken = localStorage.accessToken || sessionStorage.accessToken;

//check if user is logged in 
async function isSignedIn(){
    if (!accessToken) return false
    //make sure the jwt is valid
    const response = await get("/users/decodejwt")
    return response.status == 200
}

async function getUserJWTPayload(){
  if (!accessToken) return false
  //make sure the jwt is valid
  const response = await get("/users/decodejwt")
  return response.json()
}

async function pageRequireSignIn(){
  if (!await isSignedIn()) location.href = "signIn.html"
}

async function isUserAdmin(){
  let data = await getUserJWTPayload()
  return data && data.accessLevel> 0
}

async function pageRequireAdmin(){
  if (!await isUserAdmin()) location.href = "index.html"
}


async function post(url, jsondata){
    let settings = {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cache-control": "no-cache",
        "authorization": `Bearer ${accessToken}`
      },
  
      body: JSON.stringify(jsondata)
    }
    return await fetch(url, settings)
    
}

async function get(url){
    let settings = {
      method: "GET",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${accessToken}`
      }
    }
    return await fetch(url, settings)
  
}

async function put(url, jsondata){
  let settings = {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      "cache-control": "no-cache",
      "authorization": `Bearer ${accessToken}`
    },
    body: JSON.stringify(jsondata)
  }

  return await fetch(url, settings)
  
}