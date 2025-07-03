import requests
from typing import Optional, Tuple

def get_author_urn(access_token: str) -> Optional[str]:
    print("here inside get_author_urn")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "X-Restli-Protocol-Version": "2.0.0",
    }
    resp = requests.get("https://api.linkedin.com/v2/userinfo", headers=headers)
    print("userinfo resp", resp)
    print("userinfo status_code", resp.status_code)
    try:
        userinfo = resp.json()
    except Exception as e:
        print("Failed to parse userinfo json", e)
        userinfo = None
    if resp.status_code == 200 and userinfo and userinfo.get("sub"):
        return f"urn:li:person:{userinfo['sub']}"
    # Fallback to classic /v2/me endpoint
    resp = requests.get("https://api.linkedin.com/v2/me", headers=headers)
    print("me resp", resp)
    print("me status_code", resp.status_code)
    try:
        meinfo = resp.json()
    except Exception as e:
        print("Failed to parse me json", e)
        meinfo = None
    if resp.status_code == 200 and meinfo and meinfo.get("id"):
        return f"urn:li:person:{meinfo['id']}"
    return None

def register_image_upload(access_token: str, author_urn: str) -> Tuple[Optional[str], Optional[str]]:
    print("here inside register_image_upload")
    url = "https://api.linkedin.com/v2/assets?action=registerUpload"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json"
    }
    body = {
        "registerUploadRequest": {
            "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
            "owner": author_urn,
            "serviceRelationships": [
                {
                    "relationshipType": "OWNER",
                    "identifier": "urn:li:userGeneratedContent"
                }
            ]
        }
    }
    resp = requests.post(url, headers=headers, json=body)
    print("resp", resp)
    if resp.status_code == 200:
        data = resp.json()["value"]
        upload_url = data["uploadMechanism"]["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]["uploadUrl"]
        asset_urn = data["asset"]
        return upload_url, asset_urn
    return None, None

def upload_image_to_linkedin(upload_url: str, image_url: str) -> bool:
    img_data = requests.get(image_url).content
    resp = requests.put(upload_url, data=img_data, headers={"Content-Type": "application/octet-stream"})
    return resp.status_code in (200, 201)

def create_linkedin_post(access_token: str, author_urn: str, content: str, asset_urn: Optional[str] = None) -> Tuple[bool, Optional[str]]:
    print("here inside create_linkedin_post")
    url = "https://api.linkedin.com/v2/ugcPosts"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json"
    }
    post_data = {
        "author": author_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": content},
                "shareMediaCategory": "IMAGE" if asset_urn else "NONE",
                "media": [
                    {
                        "status": "READY",
                        "description": {"text": "Image"},
                        "media": asset_urn,
                        "title": {"text": "Image"}
                    }
                ] if asset_urn else []
            }
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
    }
    resp = requests.post(url, headers=headers, json=post_data)
    if resp.status_code in (200, 201):
        return True, resp.json().get("id")
    return False, None

def post_to_linkedin(access_token: str, content: str, image_url: Optional[str] = None) -> Tuple[bool, Optional[str]]:
    print("here inside post_to_linkedin")
    author_urn = get_author_urn(access_token)
    if not author_urn:
        print("no author urn")
        return False, None
    asset_urn = None
    if image_url:
        upload_url, asset_urn = register_image_upload(access_token, author_urn)
        if not upload_url or not asset_urn:
            print("no upload url or asset urn")
            return False, None
        if not upload_image_to_linkedin(upload_url, image_url):
            print("failed to upload image to linkedin")
            return False, None
    return create_linkedin_post(access_token, author_urn, content, asset_urn)
