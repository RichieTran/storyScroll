from fastapi import APIRouter, Query, HTTPException
import httpx

router = APIRouter()

REDDIT_BASE = "https://www.reddit.com"
HEADERS     = {"User-Agent": "StoryScroll/0.1 (story video generator)"}

# Subreddits we explicitly support — custom ones are passed through
SUPPORTED_SUBS = {
    "tifu", "nosleep", "amitheassshole", "relationship_advice",
    "maliciouscompliance", "prorevenge", "offmychest", "confession",
    "survivorsofabuse", "entitledparents",
}

SORT_MAP = {
    "hot":  "/hot.json",
    "top":  "/top.json?t=week",
    "new":  "/new.json",
}


def parse_post(post: dict) -> dict | None:
    """Extract clean fields from a Reddit API post object."""
    data = post.get("data", {})

    body = data.get("selftext", "").strip()
    # Skip removed/deleted posts and pure link posts
    if not body or body in ("[removed]", "[deleted]"):
        return None
    # Skip very short posts
    if len(body) < 100:
        return None

    return {
        "id":        data.get("id"),
        "title":     data.get("title", ""),
        "body":      body,
        "author":    data.get("author", "unknown"),
        "subreddit": data.get("subreddit", ""),
        "upvotes":   data.get("ups", 0),
        "url":       f"https://reddit.com{data.get('permalink', '')}",
        "created":   data.get("created_utc"),
        "nsfw":      data.get("over_18", False),
    }


@router.get("/reddit/stories")
async def get_reddit_stories(
    subreddit: str = Query("tifu", description="Subreddit name (without r/)"),
    sort:      str = Query("hot",  description="Sort: hot | top | new"),
    limit:     int = Query(20,    ge=1, le=50),
):
    """Proxy Reddit's public JSON endpoint and return clean story data."""
    sort      = sort if sort in SORT_MAP else "hot"
    path      = SORT_MAP[sort]
    separator = "&" if "?" in path else "?"
    url       = f"{REDDIT_BASE}/r/{subreddit}{path}{separator}limit={limit}&raw_json=1"

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=HEADERS)
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Reddit request timed out.")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Could not reach Reddit: {e}")

    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail=f"Subreddit r/{subreddit} not found.")
    if resp.status_code == 403:
        raise HTTPException(status_code=403, detail=f"r/{subreddit} is private or restricted.")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Reddit returned {resp.status_code}.")

    try:
        data  = resp.json()
        posts = data["data"]["children"]
    except Exception:
        raise HTTPException(status_code=502, detail="Failed to parse Reddit response.")

    stories = [p for post in posts if (p := parse_post(post)) is not None]

    return {
        "subreddit": subreddit,
        "sort":      sort,
        "count":     len(stories),
        "stories":   stories,
    }
