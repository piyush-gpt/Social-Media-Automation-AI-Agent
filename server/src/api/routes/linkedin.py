from fastapi import APIRouter, Request
import os
import requests
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")
LINKEDIN_REDIRECT_URI = os.getenv("LINKEDIN_REDIRECT_URI", "http://localhost:3000/linkedin-callback")

@router.post("/linkedin/exchange")
async def linkedin_exchange(request: Request):
    data = await request.json()
    code = data["code"]
    token_url = "https://www.linkedin.com/oauth/v2/accessToken"
    params = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": LINKEDIN_REDIRECT_URI,
        "client_id": LINKEDIN_CLIENT_ID,
        "client_secret": LINKEDIN_CLIENT_SECRET,
    }
    resp = requests.post(token_url, data=params, headers={"Content-Type": "application/x-www-form-urlencoded"})
    token_data = resp.json()
    print("token_data", token_data)
    return token_data  # contains access_token and expires_in 