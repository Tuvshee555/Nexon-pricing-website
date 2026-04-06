const FB_API_VERSION = "v19.0";
const FB_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;

export interface FacebookPage {
  id: string;
  name: string;
  category?: string;
  access_token: string;
}

export interface InstagramAccount {
  id: string;
  username?: string;
}

/**
 * Exchange OAuth code for a short-lived user access token.
 */
export async function exchangeCodeForShortToken(
  code: string,
  redirectUri: string
): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    client_secret: process.env.FACEBOOK_APP_SECRET!,
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`${FB_BASE}/oauth/access_token?${params}`);
  if (!res.ok) throw new Error(`FB short token error: ${await res.text()}`);
  const data = await res.json();
  if (!data.access_token) throw new Error("No access_token in FB response");
  return data.access_token as string;
}

/**
 * Exchange a short-lived user token for a long-lived one (~60 days).
 */
export async function exchangeForLongLivedToken(shortToken: string): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: process.env.FACEBOOK_APP_ID!,
    client_secret: process.env.FACEBOOK_APP_SECRET!,
    fb_exchange_token: shortToken,
  });
  const res = await fetch(`${FB_BASE}/oauth/access_token?${params}`);
  if (!res.ok) throw new Error(`FB long token error: ${await res.text()}`);
  const data = await res.json();
  if (!data.access_token) throw new Error("No long-lived access_token in FB response");
  return data.access_token as string;
}

/**
 * Fetch the list of Facebook Pages the user manages.
 * The returned access_token for each page is already long-lived.
 */
export async function getUserPages(userToken: string): Promise<FacebookPage[]> {
  const res = await fetch(
    `${FB_BASE}/me/accounts?fields=id,name,category,access_token&access_token=${userToken}`
  );
  if (!res.ok) throw new Error(`FB pages error: ${await res.text()}`);
  const data = await res.json();
  return (data.data || []) as FacebookPage[];
}

/**
 * Subscribe a Facebook Page to this app's webhook.
 * Must be called with a page-scoped access token.
 */
export async function subscribePageToWebhook(
  pageId: string,
  pageToken: string
): Promise<boolean> {
  const res = await fetch(
    `${FB_BASE}/${pageId}/subscribed_apps?access_token=${pageToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscribed_fields: ["messages", "messaging_postbacks", "messaging_optins"],
      }),
    }
  );
  if (!res.ok) {
    console.error("FB subscribe error:", await res.text());
    return false;
  }
  const data = await res.json();
  return data.success === true;
}

/**
 * Fetch the Instagram Business Account linked to a Facebook Page.
 * Returns the IG account ID or null if not linked.
 */
export async function getInstagramAccount(
  pageId: string,
  pageToken: string
): Promise<InstagramAccount | null> {
  const res = await fetch(
    `${FB_BASE}/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.instagram_business_account?.id) return null;
  return {
    id: data.instagram_business_account.id as string,
    username: data.instagram_business_account.username,
  };
}
