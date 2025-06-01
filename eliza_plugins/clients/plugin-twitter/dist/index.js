// src/index.ts
import {
  ChannelType as ChannelType7,
  EventType as EventType4,
  Role,
  Service,
  createUniqueUuid as createUniqueUuid7,
  logger as logger10
} from "@elizaos/core";

// src/actions/spaceJoin.ts
import {
  logger as logger5
} from "@elizaos/core";

// src/spaces.ts
import {
  ChannelType as ChannelType3,
  ModelType as ModelType3,
  createUniqueUuid as createUniqueUuid3,
  logger as logger4
} from "@elizaos/core";

// src/client/api.ts
import { Headers as Headers2 } from "headers-polyfill";

// src/client/errors.ts
var ApiError = class _ApiError extends Error {
  /**
   * Constructor for creating a new instance of the class.
   *
   * @param response The response object.
   * @param data The data object.
   * @param message The message string.
   */
  constructor(response, data, message) {
    super(message);
    this.response = response;
    this.data = data;
  }
  /**
   * Creates an instance of ApiError based on a Response object.
   *
   * @param {Response} response The Response object to parse.
   * @returns {Promise<ApiError>} A new instance of ApiError with the parsed data and status.
   */
  static async fromResponse(response) {
    let data = void 0;
    try {
      data = await response.json();
    } catch {
      try {
        data = await response.text();
      } catch {
      }
    }
    return new _ApiError(response, data, `Response status: ${response.status}`);
  }
};

// src/client/platform/platform-interface.ts
var genericPlatform = new class {
  randomizeCiphers() {
    return Promise.resolve();
  }
}();

// src/client/platform/index.ts
var PLATFORM_NODE = typeof process !== "undefined";
var Platform = class _Platform {
  /**
   * Asynchronously generates random ciphers using the imported platform
   */
  async randomizeCiphers() {
    const platform = await _Platform.importPlatform();
    await platform?.randomizeCiphers();
  }
  /**
   * Imports and returns the platform extensions based on the current platform.
   * @returns A Promise that resolves to the platform extensions, or null if the platform is not supported.
   */
  static async importPlatform() {
    if (PLATFORM_NODE) {
      const { platform } = await import("./node-IZDTQWG6.js");
      return platform;
    }
    return genericPlatform;
  }
};

// src/client/requests.ts
import setCookie from "set-cookie-parser";
import { Cookie } from "tough-cookie";
async function updateCookieJar(cookieJar, headers) {
  const setCookieHeader = headers.get("set-cookie");
  if (setCookieHeader) {
    const cookies = setCookie.splitCookiesString(setCookieHeader);
    for (const cookie of cookies.map((c) => Cookie.parse(c))) {
      if (!cookie) continue;
      await cookieJar.setCookie(
        cookie,
        `${cookie.secure ? "https" : "http"}://${cookie.domain}${cookie.path}`
      );
    }
  } else if (typeof document !== "undefined") {
    for (const cookie of document.cookie.split(";")) {
      const hardCookie = Cookie.parse(cookie);
      if (hardCookie) {
        await cookieJar.setCookie(hardCookie, document.location.toString());
      }
    }
  }
}

// src/client/api.ts
var bearerToken = "AAAAAAAAAAAAAAAAAAAAAFQODgEAAAAAVHTp76lzh3rFzcHbmHVvQxYYpTw%3DckAlMINMjmCwxUcaXbAN4XqJVdgMJaHqNOFgPMK0zN1qLqLQCF";
async function requestApi(url, auth, method = "GET", platform = new Platform(), body) {
  const headers = new Headers2();
  await auth.installTo(headers, url);
  await platform.randomizeCiphers();
  let res;
  do {
    try {
      res = await auth.fetch(url, {
        method,
        headers,
        credentials: "include",
        ...body && { body: JSON.stringify(body) }
      });
    } catch (err) {
      if (!(err instanceof Error)) {
        throw err;
      }
      return {
        success: false,
        err: new Error("Failed to perform request.")
      };
    }
    await updateCookieJar(auth.cookieJar(), res.headers);
    if (res.status === 429) {
      const xRateLimitRemaining = res.headers.get("x-rate-limit-remaining");
      const xRateLimitReset = res.headers.get("x-rate-limit-reset");
      if (xRateLimitRemaining === "0" && xRateLimitReset) {
        const currentTime = (/* @__PURE__ */ new Date()).valueOf() / 1e3;
        const timeDeltaMs = 1e3 * (Number.parseInt(xRateLimitReset) - currentTime);
        await new Promise((resolve) => setTimeout(resolve, timeDeltaMs));
      }
    }
  } while (res.status === 429);
  if (!res.ok) {
    return {
      success: false,
      err: await ApiError.fromResponse(res)
    };
  }
  const transferEncoding = res.headers.get("transfer-encoding");
  if (transferEncoding === "chunked") {
    const reader = typeof res.body?.getReader === "function" ? res.body.getReader() : null;
    if (!reader) {
      try {
        const text = await res.text();
        try {
          const value = JSON.parse(text);
          return { success: true, value };
        } catch (_e) {
          return { success: true, value: { text } };
        }
      } catch (_e) {
        return {
          success: false,
          err: new Error("No readable stream available and cant parse")
        };
      }
    }
    let chunks = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks += new TextDecoder().decode(value);
    }
    try {
      const value = JSON.parse(chunks);
      return { success: true, value };
    } catch (_e) {
      return { success: true, value: { text: chunks } };
    }
  }
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const value = await res.json();
    if (res.headers.get("x-rate-limit-incoming") === "0") {
      auth.deleteToken();
    }
    return { success: true, value };
  }
  return { success: true, value: {} };
}
function addApiFeatures(o) {
  return {
    ...o,
    rweb_lists_timeline_redesign_enabled: true,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    creator_subscriptions_tweet_preview_api_enabled: true,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    tweetypie_unmention_optimization_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    longform_notetweets_rich_text_read_enabled: true,
    responsive_web_enhance_cards_enabled: false,
    subscriptions_verification_info_enabled: true,
    subscriptions_verification_info_reason_enabled: true,
    subscriptions_verification_info_verified_since_enabled: true,
    super_follow_badge_privacy_enabled: false,
    super_follow_exclusive_tweet_notifications_enabled: false,
    super_follow_tweet_api_enabled: false,
    super_follow_user_api_enabled: false,
    android_graphql_skip_api_media_color_palette: false,
    creator_subscriptions_subscription_count_enabled: false,
    blue_business_profile_image_shape_enabled: false,
    unified_cards_ad_metadata_container_dynamic_card_content_query_enabled: false
  };
}
function addApiParams(params, includeTweetReplies) {
  params.set("include_profile_interstitial_type", "1");
  params.set("include_blocking", "1");
  params.set("include_blocked_by", "1");
  params.set("include_followed_by", "1");
  params.set("include_want_retweets", "1");
  params.set("include_mute_edge", "1");
  params.set("include_can_dm", "1");
  params.set("include_can_media_tag", "1");
  params.set("include_ext_has_nft_avatar", "1");
  params.set("include_ext_is_blue_verified", "1");
  params.set("include_ext_verified_type", "1");
  params.set("skip_status", "1");
  params.set("cards_platform", "Web-12");
  params.set("include_cards", "1");
  params.set("include_ext_alt_text", "true");
  params.set("include_ext_limited_action_results", "false");
  params.set("include_quote_count", "true");
  params.set("include_reply_count", "1");
  params.set("tweet_mode", "extended");
  params.set("include_ext_collab_control", "true");
  params.set("include_ext_views", "true");
  params.set("include_entities", "true");
  params.set("include_user_entities", "true");
  params.set("include_ext_media_color", "true");
  params.set("include_ext_media_availability", "true");
  params.set("include_ext_sensitive_media_warning", "true");
  params.set("include_ext_trusted_friends_metadata", "true");
  params.set("send_error_codes", "true");
  params.set("simple_quoted_tweet", "true");
  params.set("include_tweet_replies", `${includeTweetReplies}`);
  params.set(
    "ext",
    "mediaStats,highlightedLabel,hasNftAvatar,voiceInfo,birdwatchPivot,enrichments,superFollowMetadata,unmentionInfo,editControl,collab_control,vibe"
  );
  return params;
}

// src/client/auth.ts
import { Headers as Headers3 } from "headers-polyfill";
import { CookieJar } from "tough-cookie";
import { TwitterApi } from "twitter-api-v2";
function withTransform(fetchFn, transform) {
  return async (input, init) => {
    const fetchArgs = await transform?.request?.(input, init) ?? [input, init];
    const res = await fetchFn(...fetchArgs);
    return await transform?.response?.(res) ?? res;
  };
}
var TwitterGuestAuth = class {
  constructor(bearerToken2, options) {
    this.options = options;
    this.fetch = withTransform(options?.fetch ?? fetch, options?.transform);
    this.bearerToken = bearerToken2;
    this.jar = new CookieJar();
    this.v2Client = null;
  }
  cookieJar() {
    return this.jar;
  }
  getV2Client() {
    return this.v2Client ?? null;
  }
  loginWithV2(appKey, appSecret, accessToken, accessSecret) {
    const v2Client = new TwitterApi({
      appKey,
      appSecret,
      accessToken,
      accessSecret
    });
    this.v2Client = v2Client;
  }
  isLoggedIn() {
    return Promise.resolve(false);
  }
  async me() {
    return void 0;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  login(_username, _password, _email) {
    return this.updateGuestToken();
  }
  logout() {
    this.deleteToken();
    this.jar = new CookieJar();
    return Promise.resolve();
  }
  deleteToken() {
    this.guestToken = void 0;
    this.guestCreatedAt = void 0;
  }
  hasToken() {
    return this.guestToken != null;
  }
  authenticatedAt() {
    if (this.guestCreatedAt == null) {
      return null;
    }
    return new Date(this.guestCreatedAt);
  }
  async installTo(headers) {
    if (this.shouldUpdate()) {
      await this.updateGuestToken();
    }
    const token = this.guestToken;
    if (token == null) {
      throw new Error("Authentication token is null or undefined.");
    }
    headers.set("authorization", `Bearer ${this.bearerToken}`);
    headers.set("x-guest-token", token);
    const cookies = await this.getCookies();
    const xCsrfToken = cookies.find((cookie) => cookie.key === "ct0");
    if (xCsrfToken) {
      headers.set("x-csrf-token", xCsrfToken.value);
    }
    headers.set("cookie", await this.getCookieString());
  }
  getCookies() {
    return this.jar.getCookies(this.getCookieJarUrl());
  }
  getCookieString() {
    return this.jar.getCookieString(this.getCookieJarUrl());
  }
  async removeCookie(key) {
    const store = this.jar.store;
    const cookies = await this.jar.getCookies(this.getCookieJarUrl());
    for (const cookie of cookies) {
      if (!cookie.domain || !cookie.path) continue;
      store.removeCookie(cookie.domain, cookie.path, key);
      if (typeof document !== "undefined") {
        document.cookie = `${cookie.key}=; Max-Age=0; path=${cookie.path}; domain=${cookie.domain}`;
      }
    }
  }
  getCookieJarUrl() {
    return typeof document !== "undefined" ? document.location.toString() : "https://twitter.com";
  }
  /**
   * Updates the authentication state with a new guest token from the Twitter API.
   */
  async updateGuestToken() {
    const guestActivateUrl = "https://api.twitter.com/1.1/guest/activate.json";
    const headers = new Headers3({
      Authorization: `Bearer ${this.bearerToken}`,
      Cookie: await this.getCookieString()
    });
    const res = await this.fetch(guestActivateUrl, {
      method: "POST",
      headers,
      referrerPolicy: "no-referrer"
    });
    await updateCookieJar(this.jar, res.headers);
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const o = await res.json();
    if (o == null || o.guest_token == null) {
      throw new Error("guest_token not found.");
    }
    const newGuestToken = o.guest_token;
    if (typeof newGuestToken !== "string") {
      throw new Error("guest_token was not a string.");
    }
    this.guestToken = newGuestToken;
    this.guestCreatedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Returns if the authentication token needs to be updated or not.
   * @returns `true` if the token needs to be updated; `false` otherwise.
   */
  shouldUpdate() {
    return !this.hasToken() || this.guestCreatedAt != null && this.guestCreatedAt < new Date((/* @__PURE__ */ new Date()).valueOf() - 3 * 60 * 60 * 1e3);
  }
};

// src/client/auth-user.ts
import { Type } from "@sinclair/typebox";
import { Check } from "@sinclair/typebox/value";
import { Headers as Headers4 } from "headers-polyfill";
import * as OTPAuth from "otpauth";
import { CookieJar as CookieJar2 } from "tough-cookie";

// src/client/profile.ts
import stringify from "json-stable-stringify";
function getAvatarOriginalSizeUrl(avatarUrl) {
  return avatarUrl ? avatarUrl.replace("_normal", "") : void 0;
}
function parseProfile(user, isBlueVerified) {
  const profile = {
    avatar: getAvatarOriginalSizeUrl(user.profile_image_url_https),
    banner: user.profile_banner_url,
    biography: user.description,
    followersCount: user.followers_count,
    followingCount: user.friends_count,
    friendsCount: user.friends_count,
    mediaCount: user.media_count,
    isPrivate: user.protected ?? false,
    isVerified: user.verified,
    likesCount: user.favourites_count,
    listedCount: user.listed_count,
    location: user.location,
    name: user.name,
    pinnedTweetIds: user.pinned_tweet_ids_str,
    tweetsCount: user.statuses_count,
    url: `https://twitter.com/${user.screen_name}`,
    userId: user.id_str,
    username: user.screen_name,
    isBlueVerified: isBlueVerified ?? false,
    canDm: user.can_dm
  };
  if (user.created_at != null) {
    profile.joined = new Date(Date.parse(user.created_at));
  }
  const urls = user.entities?.url?.urls;
  if (urls?.length != null && urls?.length > 0) {
    profile.website = urls[0].expanded_url;
  }
  return profile;
}
async function getProfile(username, auth) {
  const params = new URLSearchParams();
  params.set(
    "variables",
    stringify({
      screen_name: username,
      withSafetyModeUserFields: true
    }) ?? ""
  );
  params.set(
    "features",
    stringify({
      hidden_profile_likes_enabled: false,
      hidden_profile_subscriptions_enabled: false,
      // Auth-restricted
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      subscriptions_verification_info_is_identity_verified_enabled: false,
      subscriptions_verification_info_verified_since_enabled: true,
      highlights_tweets_tab_ui_enabled: true,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      responsive_web_graphql_timeline_navigation_enabled: true
    }) ?? ""
  );
  params.set("fieldToggles", stringify({ withAuxiliaryUserLabels: false }) ?? "");
  const res = await requestApi(
    `https://twitter.com/i/api/graphql/G3KGOASz96M-Qu0nwmGXNg/UserByScreenName?${params.toString()}`,
    auth
  );
  if (!res.success) {
    return res;
  }
  const { value } = res;
  const { errors } = value;
  if (errors != null && errors.length > 0) {
    return {
      success: false,
      err: new Error(errors[0].message)
    };
  }
  if (!value.data || !value.data.user || !value.data.user.result) {
    return {
      success: false,
      err: new Error("User not found.")
    };
  }
  const { result: user } = value.data.user;
  const { legacy } = user;
  if (user.rest_id == null || user.rest_id.length === 0) {
    return {
      success: false,
      err: new Error("rest_id not found.")
    };
  }
  legacy.id_str = user.rest_id;
  if (legacy.screen_name == null || legacy.screen_name.length === 0) {
    return {
      success: false,
      err: new Error(`Either ${username} does not exist or is private.`)
    };
  }
  return {
    success: true,
    value: parseProfile(user.legacy, user.is_blue_verified)
  };
}
var idCache = /* @__PURE__ */ new Map();
async function getScreenNameByUserId(userId, auth) {
  const params = new URLSearchParams();
  params.set(
    "variables",
    stringify({
      userId,
      withSafetyModeUserFields: true
    }) ?? ""
  );
  params.set(
    "features",
    stringify({
      hidden_profile_subscriptions_enabled: true,
      rweb_tipjar_consumption_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      highlights_tweets_tab_ui_enabled: true,
      responsive_web_twitter_article_notes_tab_enabled: true,
      subscriptions_feature_can_gift_premium: false,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      responsive_web_graphql_timeline_navigation_enabled: true
    }) ?? ""
  );
  const res = await requestApi(
    `https://twitter.com/i/api/graphql/xf3jd90KKBCUxdlI_tNHZw/UserByRestId?${params.toString()}`,
    auth
  );
  if (!res.success) {
    return res;
  }
  const { value } = res;
  const { errors } = value;
  if (errors != null && errors.length > 0) {
    return {
      success: false,
      err: new Error(errors[0].message)
    };
  }
  if (!value.data || !value.data.user || !value.data.user.result) {
    return {
      success: false,
      err: new Error("User not found.")
    };
  }
  const { result: user } = value.data.user;
  const { legacy } = user;
  if (legacy.screen_name == null || legacy.screen_name.length === 0) {
    return {
      success: false,
      err: new Error(`Either user with ID ${userId} does not exist or is private.`)
    };
  }
  return {
    success: true,
    value: legacy.screen_name
  };
}
async function getEntityIdByScreenName(screenName, auth) {
  const cached = idCache.get(screenName);
  if (cached != null) {
    return { success: true, value: cached };
  }
  const profileRes = await getProfile(screenName, auth);
  if (!profileRes.success) {
    return profileRes;
  }
  const profile = profileRes.value;
  if (profile.userId != null) {
    idCache.set(screenName, profile.userId);
    return {
      success: true,
      value: profile.userId
    };
  }
  return {
    success: false,
    err: new Error("User ID is undefined.")
  };
}

// src/client/auth-user.ts
var TwitterUserAuthSubtask = Type.Object({
  subtask_id: Type.String(),
  enter_text: Type.Optional(Type.Object({}))
});
var TwitterUserAuth = class extends TwitterGuestAuth {
  async isLoggedIn() {
    const res = await requestApi(
      "https://api.twitter.com/1.1/account/verify_credentials.json",
      this
    );
    if (!res.success) {
      return false;
    }
    const { value: verify } = res;
    this.userProfile = parseProfile(
      verify,
      verify.verified
    );
    return verify && !verify.errors?.length;
  }
  async me() {
    if (this.userProfile) {
      return this.userProfile;
    }
    await this.isLoggedIn();
    return this.userProfile;
  }
  async login(username, password, email, twoFactorSecret, appKey, appSecret, accessToken, accessSecret) {
    await this.updateGuestToken();
    let next = await this.initLogin();
    while ("subtask" in next && next.subtask) {
      if (next.subtask.subtask_id === "LoginJsInstrumentationSubtask") {
        next = await this.handleJsInstrumentationSubtask(next);
      } else if (next.subtask.subtask_id === "LoginEnterUserIdentifierSSO") {
        next = await this.handleEnterUserIdentifierSSO(next, username);
      } else if (next.subtask.subtask_id === "LoginEnterAlternateIdentifierSubtask") {
        next = await this.handleEnterAlternateIdentifierSubtask(next, email);
      } else if (next.subtask.subtask_id === "LoginEnterPassword") {
        next = await this.handleEnterPassword(next, password);
      } else if (next.subtask.subtask_id === "AccountDuplicationCheck") {
        next = await this.handleAccountDuplicationCheck(next);
      } else if (next.subtask.subtask_id === "LoginTwoFactorAuthChallenge") {
        if (twoFactorSecret) {
          next = await this.handleTwoFactorAuthChallenge(next, twoFactorSecret);
        } else {
          throw new Error("Requested two factor authentication code but no secret provided");
        }
      } else if (next.subtask.subtask_id === "LoginAcid") {
        next = await this.handleAcid(next, email);
      } else if (next.subtask.subtask_id === "LoginSuccessSubtask") {
        next = await this.handleSuccessSubtask(next);
      } else {
        throw new Error(`Unknown subtask ${next.subtask.subtask_id}`);
      }
    }
    if (appKey && appSecret && accessToken && accessSecret) {
      this.loginWithV2(appKey, appSecret, accessToken, accessSecret);
    }
    if ("err" in next) {
      throw next.err;
    }
  }
  async logout() {
    if (!this.isLoggedIn()) {
      return;
    }
    await requestApi("https://api.twitter.com/1.1/account/logout.json", this, "POST");
    this.deleteToken();
    this.jar = new CookieJar2();
  }
  async installCsrfToken(headers) {
    const cookies = await this.getCookies();
    const xCsrfToken = cookies.find((cookie) => cookie.key === "ct0");
    if (xCsrfToken) {
      headers.set("x-csrf-token", xCsrfToken.value);
    }
  }
  async installTo(headers) {
    headers.set("authorization", `Bearer ${this.bearerToken}`);
    headers.set("cookie", await this.getCookieString());
    await this.installCsrfToken(headers);
  }
  async initLogin() {
    this.removeCookie("twitter_ads_id=");
    this.removeCookie("ads_prefs=");
    this.removeCookie("_twitter_sess=");
    this.removeCookie("zipbox_forms_auth_token=");
    this.removeCookie("lang=");
    this.removeCookie("bouncer_reset_cookie=");
    this.removeCookie("twid=");
    this.removeCookie("twitter_ads_idb=");
    this.removeCookie("email_uid=");
    this.removeCookie("external_referer=");
    this.removeCookie("ct0=");
    this.removeCookie("aa_u=");
    return await this.executeFlowTask({
      flow_name: "login",
      input_flow_data: {
        flow_context: {
          debug_overrides: {},
          start_location: {
            location: "splash_screen"
          }
        }
      }
    });
  }
  async handleJsInstrumentationSubtask(prev) {
    return await this.executeFlowTask({
      flow_token: prev.flowToken,
      subtask_inputs: [
        {
          subtask_id: "LoginJsInstrumentationSubtask",
          js_instrumentation: {
            response: "{}",
            link: "next_link"
          }
        }
      ]
    });
  }
  async handleEnterAlternateIdentifierSubtask(prev, email) {
    return await this.executeFlowTask({
      flow_token: prev.flowToken,
      subtask_inputs: [
        {
          subtask_id: "LoginEnterAlternateIdentifierSubtask",
          enter_text: {
            text: email,
            link: "next_link"
          }
        }
      ]
    });
  }
  async handleEnterUserIdentifierSSO(prev, username) {
    return await this.executeFlowTask({
      flow_token: prev.flowToken,
      subtask_inputs: [
        {
          subtask_id: "LoginEnterUserIdentifierSSO",
          settings_list: {
            setting_responses: [
              {
                key: "user_identifier",
                response_data: {
                  text_data: { result: username }
                }
              }
            ],
            link: "next_link"
          }
        }
      ]
    });
  }
  async handleEnterPassword(prev, password) {
    return await this.executeFlowTask({
      flow_token: prev.flowToken,
      subtask_inputs: [
        {
          subtask_id: "LoginEnterPassword",
          enter_password: {
            password,
            link: "next_link"
          }
        }
      ]
    });
  }
  async handleAccountDuplicationCheck(prev) {
    return await this.executeFlowTask({
      flow_token: prev.flowToken,
      subtask_inputs: [
        {
          subtask_id: "AccountDuplicationCheck",
          check_logged_in_account: {
            link: "AccountDuplicationCheck_false"
          }
        }
      ]
    });
  }
  async handleTwoFactorAuthChallenge(prev, secret) {
    const totp = new OTPAuth.TOTP({ secret });
    let error;
    for (let attempts = 1; attempts < 4; attempts += 1) {
      try {
        return await this.executeFlowTask({
          flow_token: prev.flowToken,
          subtask_inputs: [
            {
              subtask_id: "LoginTwoFactorAuthChallenge",
              enter_text: {
                link: "next_link",
                text: totp.generate()
              }
            }
          ]
        });
      } catch (err) {
        error = err;
        await new Promise((resolve) => setTimeout(resolve, 2e3 * attempts));
      }
    }
    throw error;
  }
  async handleAcid(prev, email) {
    return await this.executeFlowTask({
      flow_token: prev.flowToken,
      subtask_inputs: [
        {
          subtask_id: "LoginAcid",
          enter_text: {
            text: email,
            link: "next_link"
          }
        }
      ]
    });
  }
  async handleSuccessSubtask(prev) {
    return await this.executeFlowTask({
      flow_token: prev.flowToken,
      subtask_inputs: []
    });
  }
  async executeFlowTask(data) {
    const onboardingTaskUrl = "https://api.twitter.com/1.1/onboarding/task.json";
    const token = this.guestToken;
    if (token == null) {
      throw new Error("Authentication token is null or undefined.");
    }
    const headers = new Headers4({
      authorization: `Bearer ${this.bearerToken}`,
      cookie: await this.getCookieString(),
      "content-type": "application/json",
      "User-Agent": "Mozilla/5.0 (Linux; Android 11; Nokia G20) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.88 Mobile Safari/537.36",
      "x-guest-token": token,
      "x-twitter-auth-type": "OAuth2Client",
      "x-twitter-active-user": "yes",
      "x-twitter-client-language": "en"
    });
    await this.installCsrfToken(headers);
    const res = await this.fetch(onboardingTaskUrl, {
      credentials: "include",
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    await updateCookieJar(this.jar, res.headers);
    if (!res.ok) {
      return { status: "error", err: new Error(await res.text()) };
    }
    const flow = await res.json();
    if (flow?.flow_token == null) {
      return { status: "error", err: new Error("flow_token not found.") };
    }
    if (flow.errors?.length) {
      return {
        status: "error",
        err: new Error(`Authentication error (${flow.errors[0].code}): ${flow.errors[0].message}`)
      };
    }
    if (typeof flow.flow_token !== "string") {
      return {
        status: "error",
        err: new Error("flow_token was not a string.")
      };
    }
    const subtask = flow.subtasks?.length ? flow.subtasks[0] : void 0;
    Check(TwitterUserAuthSubtask, subtask);
    if (subtask && subtask.subtask_id === "DenyLoginSubtask") {
      return {
        status: "error",
        err: new Error("Authentication error: DenyLoginSubtask")
      };
    }
    return {
      status: "success",
      subtask,
      flowToken: flow.flow_token
    };
  }
};

// src/client/grok.ts
async function createGrokConversation(auth) {
  const res = await requestApi(
    "https://x.com/i/api/graphql/6cmfJY3d7EPWuCSXWrkOFg/CreateGrokConversation",
    auth,
    "POST"
  );
  if (!res.success) {
    throw res.err;
  }
  return res.value.data.create_grok_conversation.conversation_id;
}
async function grokChat(options, auth) {
  let { conversationId, messages } = options;
  if (!conversationId) {
    conversationId = await createGrokConversation(auth);
  }
  const responses = messages.map((msg) => ({
    message: msg.content,
    sender: msg.role === "user" ? 1 : 2,
    ...msg.role === "user" && {
      promptSource: "",
      fileAttachments: []
    }
  }));
  const payload = {
    responses,
    systemPromptName: "",
    grokModelOptionId: "grok-2a",
    conversationId,
    returnSearchResults: options.returnSearchResults ?? true,
    returnCitations: options.returnCitations ?? true,
    promptMetadata: {
      promptSource: "NATURAL",
      action: "INPUT"
    },
    imageGenerationCount: 4,
    requestFeatures: {
      eagerTweets: true,
      serverHistory: true
    }
  };
  const res = await requestApi(
    "https://api.x.com/2/grok/add_response.json",
    auth,
    "POST",
    void 0,
    payload
  );
  if (!res.success) {
    throw res.err;
  }
  let chunks;
  if (res.value.text) {
    chunks = res.value.text.split("\n").filter(Boolean).map((chunk) => JSON.parse(chunk));
  } else {
    chunks = [res.value];
  }
  const firstChunk = chunks[0];
  if (firstChunk.result?.responseType === "limiter") {
    return {
      conversationId,
      message: firstChunk.result.message,
      messages: [...messages, { role: "assistant", content: firstChunk.result.message }],
      rateLimit: {
        isRateLimited: true,
        message: firstChunk.result.message,
        upsellInfo: firstChunk.result.upsell ? {
          usageLimit: firstChunk.result.upsell.usageLimit,
          quotaDuration: `${firstChunk.result.upsell.quotaDurationCount} ${firstChunk.result.upsell.quotaDurationPeriod}`,
          title: firstChunk.result.upsell.title,
          message: firstChunk.result.upsell.message
        } : void 0
      }
    };
  }
  const fullMessage = chunks.filter((chunk) => chunk.result?.message).map((chunk) => chunk.result.message).join("");
  return {
    conversationId,
    message: fullMessage,
    messages: [...messages, { role: "assistant", content: fullMessage }],
    webResults: chunks.find((chunk) => chunk.result?.webResults)?.result.webResults,
    metadata: chunks[0]
  };
}

// src/client/messages.ts
function parseDirectMessageConversations(data, userId) {
  try {
    const inboxState = data?.inbox_initial_state;
    const conversations = inboxState?.conversations || {};
    const entries = inboxState?.entries || [];
    const users = inboxState?.users || {};
    const parsedUsers = Object.values(users).map((user) => ({
      id: user.id_str,
      screenName: user.screen_name,
      name: user.name,
      profileImageUrl: user.profile_image_url_https,
      description: user.description,
      verified: user.verified,
      protected: user.protected,
      followersCount: user.followers_count,
      friendsCount: user.friends_count
    }));
    const messagesByConversation = {};
    entries.forEach((entry) => {
      if (entry.message) {
        const convId = entry.message.conversation_id;
        if (!messagesByConversation[convId]) {
          messagesByConversation[convId] = [];
        }
        messagesByConversation[convId].push(entry.message);
      }
    });
    const parsedConversations = Object.entries(conversations).map(
      ([convId, conv]) => {
        const messages = messagesByConversation[convId] || [];
        messages.sort((a, b) => Number(a.time) - Number(b.time));
        return {
          conversationId: convId,
          messages: parseDirectMessages(messages, users),
          participants: conv.participants.map((p) => ({
            id: p.user_id,
            screenName: users[p.user_id]?.screen_name || p.user_id
          }))
        };
      }
    );
    return {
      conversations: parsedConversations,
      users: parsedUsers,
      cursor: inboxState?.cursor,
      lastSeenEventId: inboxState?.last_seen_event_id,
      trustedLastSeenEventId: inboxState?.trusted_last_seen_event_id,
      untrustedLastSeenEventId: inboxState?.untrusted_last_seen_event_id,
      inboxTimelines: {
        trusted: inboxState?.inbox_timelines?.trusted && {
          status: inboxState.inbox_timelines.trusted.status,
          minEntryId: inboxState.inbox_timelines.trusted.min_entry_id
        },
        untrusted: inboxState?.inbox_timelines?.untrusted && {
          status: inboxState.inbox_timelines.untrusted.status,
          minEntryId: inboxState.inbox_timelines.untrusted.min_entry_id
        }
      },
      userId
    };
  } catch (error) {
    console.error("Error parsing DM conversations:", error);
    return {
      conversations: [],
      users: [],
      userId
    };
  }
}
function parseDirectMessages(messages, users) {
  try {
    return messages.map((msg) => ({
      id: msg.message_data.id,
      text: msg.message_data.text,
      senderId: msg.message_data.sender_id,
      recipientId: msg.message_data.recipient_id,
      createdAt: msg.message_data.time,
      mediaUrls: extractMediaUrls(msg.message_data),
      senderScreenName: users[msg.message_data.sender_id]?.screen_name,
      recipientScreenName: users[msg.message_data.recipient_id]?.screen_name
    }));
  } catch (error) {
    console.error("Error parsing DMs:", error);
    return [];
  }
}
function extractMediaUrls(messageData) {
  const urls = [];
  if (messageData.entities?.urls) {
    messageData.entities.urls.forEach((url) => {
      urls.push(url.expanded_url);
    });
  }
  if (messageData.entities?.media) {
    messageData.entities.media.forEach((media) => {
      urls.push(media.media_url_https || media.media_url);
    });
  }
  return urls.length > 0 ? urls : void 0;
}
async function getDirectMessageConversations(userId, auth, cursor) {
  if (!auth.isLoggedIn()) {
    throw new Error("Authentication required to fetch direct messages");
  }
  const url = "https://twitter.com/i/api/graphql/7s3kOODhC5vgXlO0OlqYdA/DMInboxTimeline";
  const messageListUrl = "https://x.com/i/api/1.1/dm/inbox_initial_state.json";
  const params = new URLSearchParams();
  if (cursor) {
    params.append("cursor", cursor);
  }
  const finalUrl = `${messageListUrl}${params.toString() ? `?${params.toString()}` : ""}`;
  const cookies = await auth.cookieJar().getCookies(url);
  const xCsrfToken = cookies.find((cookie) => cookie.key === "ct0");
  const headers = new Headers({
    authorization: `Bearer ${auth.bearerToken}`,
    cookie: await auth.cookieJar().getCookieString(url),
    "content-type": "application/json",
    "User-Agent": "Mozilla/5.0 (Linux; Android 11; Nokia G20) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.88 Mobile Safari/537.36",
    "x-guest-token": auth.guestToken,
    "x-twitter-auth-type": "OAuth2Client",
    "x-twitter-active-user": "yes",
    "x-csrf-token": xCsrfToken?.value
  });
  const response = await fetch(finalUrl, {
    method: "GET",
    headers
  });
  await updateCookieJar(auth.cookieJar(), response.headers);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const data = await response.json();
  return parseDirectMessageConversations(data, userId);
}
async function sendDirectMessage(auth, conversation_id, text) {
  if (!auth.isLoggedIn()) {
    throw new Error("Authentication required to send direct messages");
  }
  const url = "https://twitter.com/i/api/graphql/7s3kOODhC5vgXlO0OlqYdA/DMInboxTimeline";
  const messageDmUrl = "https://x.com/i/api/1.1/dm/new2.json";
  const cookies = await auth.cookieJar().getCookies(url);
  const xCsrfToken = cookies.find((cookie) => cookie.key === "ct0");
  const headers = new Headers({
    authorization: `Bearer ${auth.bearerToken}`,
    cookie: await auth.cookieJar().getCookieString(url),
    "content-type": "application/json",
    "User-Agent": "Mozilla/5.0 (Linux; Android 11; Nokia G20) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.88 Mobile Safari/537.36",
    "x-guest-token": auth.guestToken,
    "x-twitter-auth-type": "OAuth2Client",
    "x-twitter-active-user": "yes",
    "x-csrf-token": xCsrfToken?.value
  });
  const payload = {
    conversation_id: `${conversation_id}`,
    recipient_ids: false,
    text,
    cards_platform: "Web-12",
    include_cards: 1,
    include_quote_count: true,
    dm_users: false
  };
  const response = await fetch(messageDmUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  await updateCookieJar(auth.cookieJar(), response.headers);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return await response.json();
}

// src/client/relationships.ts
import { Headers as Headers5 } from "headers-polyfill";
import stringify2 from "json-stable-stringify";

// src/client/timeline-async.ts
async function* getUserTimeline(query, maxProfiles, fetchFunc) {
  let nProfiles = 0;
  let cursor = void 0;
  let consecutiveEmptyBatches = 0;
  while (nProfiles < maxProfiles) {
    const batch = await fetchFunc(query, maxProfiles, cursor);
    const { profiles, next } = batch;
    cursor = next;
    if (profiles.length === 0) {
      consecutiveEmptyBatches++;
      if (consecutiveEmptyBatches > 5) break;
    } else consecutiveEmptyBatches = 0;
    for (const profile of profiles) {
      if (nProfiles < maxProfiles) yield profile;
      else break;
      nProfiles++;
    }
    if (!next) break;
  }
}
async function* getTweetTimeline(query, maxTweets, fetchFunc) {
  let nTweets = 0;
  let cursor = void 0;
  while (nTweets < maxTweets) {
    const batch = await fetchFunc(query, maxTweets, cursor);
    const { tweets, next } = batch;
    if (tweets.length === 0) {
      break;
    }
    for (const tweet of tweets) {
      if (nTweets < maxTweets) {
        cursor = next;
        yield tweet;
      } else {
        break;
      }
      nTweets++;
    }
  }
}

// src/client/timeline-relationship.ts
function parseRelationshipTimeline(timeline) {
  let bottomCursor;
  let topCursor;
  const profiles = [];
  const instructions = timeline.data?.user?.result?.timeline?.timeline?.instructions ?? [];
  for (const instruction of instructions) {
    if (instruction.type === "TimelineAddEntries" || instruction.type === "TimelineReplaceEntry") {
      if (instruction.entry?.content?.cursorType === "Bottom") {
        bottomCursor = instruction.entry.content.value;
        continue;
      }
      if (instruction.entry?.content?.cursorType === "Top") {
        topCursor = instruction.entry.content.value;
        continue;
      }
      const entries = instruction.entries ?? [];
      for (const entry of entries) {
        const itemContent = entry.content?.itemContent;
        if (itemContent?.userDisplayType === "User") {
          const userResultRaw = itemContent.user_results?.result;
          if (userResultRaw?.legacy) {
            const profile = parseProfile(userResultRaw.legacy, userResultRaw.is_blue_verified);
            if (!profile.userId) {
              profile.userId = userResultRaw.rest_id;
            }
            profiles.push(profile);
          }
        } else if (entry.content?.cursorType === "Bottom") {
          bottomCursor = entry.content.value;
        } else if (entry.content?.cursorType === "Top") {
          topCursor = entry.content.value;
        }
      }
    }
  }
  return { profiles, next: bottomCursor, previous: topCursor };
}

// src/client/relationships.ts
function getFollowing(userId, maxProfiles, auth) {
  return getUserTimeline(userId, maxProfiles, (q, mt, c) => {
    return fetchProfileFollowing(q, mt, auth, c);
  });
}
function getFollowers(userId, maxProfiles, auth) {
  return getUserTimeline(userId, maxProfiles, (q, mt, c) => {
    return fetchProfileFollowers(q, mt, auth, c);
  });
}
async function fetchProfileFollowing(userId, maxProfiles, auth, cursor) {
  const timeline = await getFollowingTimeline(userId, maxProfiles, auth, cursor);
  return parseRelationshipTimeline(timeline);
}
async function fetchProfileFollowers(userId, maxProfiles, auth, cursor) {
  const timeline = await getFollowersTimeline(userId, maxProfiles, auth, cursor);
  return parseRelationshipTimeline(timeline);
}
async function getFollowingTimeline(userId, maxItems, auth, cursor) {
  if (!auth.isLoggedIn()) {
    throw new Error("Client is not logged-in for profile following.");
  }
  if (maxItems > 50) {
    maxItems = 50;
  }
  const variables = {
    userId,
    count: maxItems,
    includePromotedContent: false
  };
  const features2 = addApiFeatures({
    responsive_web_twitter_article_tweet_consumption_enabled: false,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    responsive_web_media_download_video_enabled: false
  });
  if (cursor != null && cursor !== "") {
    variables.cursor = cursor;
  }
  const params = new URLSearchParams();
  params.set("features", stringify2(features2) ?? "");
  params.set("variables", stringify2(variables) ?? "");
  const res = await requestApi(
    `https://twitter.com/i/api/graphql/iSicc7LrzWGBgDPL0tM_TQ/Following?${params.toString()}`,
    auth
  );
  if (!res.success) {
    throw res.err;
  }
  return res.value;
}
async function getFollowersTimeline(userId, maxItems, auth, cursor) {
  if (!auth.isLoggedIn()) {
    throw new Error("Client is not logged-in for profile followers.");
  }
  if (maxItems > 50) {
    maxItems = 50;
  }
  const variables = {
    userId,
    count: maxItems,
    includePromotedContent: false
  };
  const features2 = addApiFeatures({
    responsive_web_twitter_article_tweet_consumption_enabled: false,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    responsive_web_media_download_video_enabled: false
  });
  if (cursor != null && cursor !== "") {
    variables.cursor = cursor;
  }
  const params = new URLSearchParams();
  params.set("features", stringify2(features2) ?? "");
  params.set("variables", stringify2(variables) ?? "");
  const res = await requestApi(
    `https://twitter.com/i/api/graphql/rRXFSG5vR6drKr5M37YOTw/Followers?${params.toString()}`,
    auth
  );
  if (!res.success) {
    throw res.err;
  }
  return res.value;
}
async function followUser(username, auth) {
  if (!await auth.isLoggedIn()) {
    throw new Error("Must be logged in to follow users");
  }
  const userIdResult = await getEntityIdByScreenName(username, auth);
  if (!userIdResult.success) {
    throw new Error(`Failed to get user ID: ${userIdResult.err.message}`);
  }
  const userId = userIdResult.value;
  const requestBody = {
    include_profile_interstitial_type: "1",
    skip_status: "true",
    user_id: userId
  };
  const headers = new Headers5({
    "Content-Type": "application/x-www-form-urlencoded",
    Referer: `https://twitter.com/${username}`,
    "X-Twitter-Active-User": "yes",
    "X-Twitter-Auth-Type": "OAuth2Session",
    "X-Twitter-Client-Language": "en",
    Authorization: `Bearer ${bearerToken}`
  });
  await auth.installTo(headers, "https://api.twitter.com/1.1/friendships/create.json");
  const res = await auth.fetch("https://api.twitter.com/1.1/friendships/create.json", {
    method: "POST",
    headers,
    body: new URLSearchParams(requestBody).toString(),
    credentials: "include"
  });
  if (!res.ok) {
    throw new Error(`Failed to follow user: ${res.statusText}`);
  }
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

// src/client/search.ts
import stringify3 from "json-stable-stringify";

// src/client/type-util.ts
function isFieldDefined(key) {
  return (value) => isDefined(value[key]);
}
function isDefined(value) {
  return value != null;
}

// src/client/timeline-tweet-util.ts
var reHashtag = /\B(\#\S+\b)/g;
var reCashtag = /\B(\$\S+\b)/g;
var reTwitterUrl = /https:(\/\/t\.co\/([A-Za-z0-9]|[A-Za-z]){10})/g;
var reUsername = /\B(\@\S{1,15}\b)/g;
function parseMediaGroups(media) {
  const photos = [];
  const videos = [];
  let sensitiveContent = void 0;
  for (const m of media.filter(isFieldDefined("id_str")).filter(isFieldDefined("media_url_https"))) {
    if (m.type === "photo") {
      photos.push({
        id: m.id_str,
        url: m.media_url_https,
        alt_text: m.ext_alt_text
      });
    } else if (m.type === "video") {
      videos.push(parseVideo(m));
    }
    const sensitive = m.ext_sensitive_media_warning;
    if (sensitive != null) {
      sensitiveContent = sensitive.adult_content || sensitive.graphic_violence || sensitive.other;
    }
  }
  return { sensitiveContent, photos, videos };
}
function parseVideo(m) {
  const video = {
    id: m.id_str,
    preview: m.media_url_https
  };
  let maxBitrate = 0;
  const variants = m.video_info?.variants ?? [];
  for (const variant of variants) {
    const bitrate = variant.bitrate;
    if (bitrate != null && bitrate > maxBitrate && variant.url != null) {
      let variantUrl = variant.url;
      const stringStart = 0;
      const tagSuffixIdx = variantUrl.indexOf("?tag=10");
      if (tagSuffixIdx !== -1) {
        variantUrl = variantUrl.substring(stringStart, tagSuffixIdx + 1);
      }
      video.url = variantUrl;
      maxBitrate = bitrate;
    }
  }
  return video;
}
function reconstructTweetHtml(tweet, photos, videos) {
  const media = [];
  let html = tweet.full_text ?? "";
  html = html.replace(reHashtag, linkHashtagHtml);
  html = html.replace(reCashtag, linkCashtagHtml);
  html = html.replace(reUsername, linkUsernameHtml);
  html = html.replace(reTwitterUrl, unwrapTcoUrlHtml(tweet, media));
  for (const { url } of photos) {
    if (media.indexOf(url) !== -1) {
      continue;
    }
    html += `<br><img src="${url}"/>`;
  }
  for (const { preview: url } of videos) {
    if (media.indexOf(url) !== -1) {
      continue;
    }
    html += `<br><img src="${url}"/>`;
  }
  html = html.replace(/\n/g, "<br>");
  return html;
}
function linkHashtagHtml(hashtag) {
  return `<a href="https://twitter.com/hashtag/${hashtag.replace("#", "")}">${hashtag}</a>`;
}
function linkCashtagHtml(cashtag) {
  return `<a href="https://twitter.com/search?q=%24${cashtag.replace("$", "")}">${cashtag}</a>`;
}
function linkUsernameHtml(username) {
  return `<a href="https://twitter.com/${username.replace("@", "")}">${username}</a>`;
}
function unwrapTcoUrlHtml(tweet, foundedMedia) {
  return (tco) => {
    for (const entity of tweet.entities?.urls ?? []) {
      if (tco === entity.url && entity.expanded_url != null) {
        return `<a href="${entity.expanded_url}">${tco}</a>`;
      }
    }
    for (const entity of tweet.extended_entities?.media ?? []) {
      if (tco === entity.url && entity.media_url_https != null) {
        foundedMedia.push(entity.media_url_https);
        return `<br><a href="${tco}"><img src="${entity.media_url_https}"/></a>`;
      }
    }
    return tco;
  };
}

// src/client/timeline-v2.ts
function parseLegacyTweet(user, tweet) {
  if (tweet == null) {
    return {
      success: false,
      err: new Error("Tweet was not found in the timeline object.")
    };
  }
  if (user == null) {
    return {
      success: false,
      err: new Error("User was not found in the timeline object.")
    };
  }
  if (!tweet.id_str) {
    if (!tweet.conversation_id_str) {
      return {
        success: false,
        err: new Error("Tweet ID was not found in object.")
      };
    }
    tweet.id_str = tweet.conversation_id_str;
  }
  const hashtags = tweet.entities?.hashtags ?? [];
  const mentions = tweet.entities?.user_mentions ?? [];
  const media = tweet.extended_entities?.media ?? [];
  const pinnedTweets = new Set(user.pinned_tweet_ids_str ?? []);
  const urls = tweet.entities?.urls ?? [];
  const { photos, videos, sensitiveContent } = parseMediaGroups(media);
  const tw = {
    bookmarkCount: tweet.bookmark_count,
    conversationId: tweet.conversation_id_str,
    id: tweet.id_str,
    hashtags: hashtags.filter(isFieldDefined("text")).map((hashtag) => hashtag.text),
    likes: tweet.favorite_count,
    mentions: mentions.filter(isFieldDefined("id_str")).map((mention) => ({
      id: mention.id_str,
      username: mention.screen_name,
      name: mention.name
    })),
    name: user.name,
    permanentUrl: `https://twitter.com/${user.screen_name}/status/${tweet.id_str}`,
    photos,
    replies: tweet.reply_count,
    retweets: tweet.retweet_count,
    text: tweet.full_text,
    thread: [],
    urls: urls.filter(isFieldDefined("expanded_url")).map((url) => url.expanded_url),
    userId: tweet.user_id_str,
    username: user.screen_name,
    videos,
    isQuoted: false,
    isReply: false,
    isRetweet: false,
    isPin: false,
    sensitiveContent: false
  };
  if (tweet.created_at) {
    tw.timeParsed = new Date(Date.parse(tweet.created_at));
    tw.timestamp = Math.floor(tw.timeParsed.valueOf() / 1e3);
  }
  if (tweet.place?.id) {
    tw.place = tweet.place;
  }
  const quotedStatusIdStr = tweet.quoted_status_id_str;
  const inReplyToStatusIdStr = tweet.in_reply_to_status_id_str;
  const retweetedStatusIdStr = tweet.retweeted_status_id_str;
  const retweetedStatusResult = tweet.retweeted_status_result?.result;
  if (quotedStatusIdStr) {
    tw.isQuoted = true;
    tw.quotedStatusId = quotedStatusIdStr;
  }
  if (inReplyToStatusIdStr) {
    tw.isReply = true;
    tw.inReplyToStatusId = inReplyToStatusIdStr;
  }
  if (retweetedStatusIdStr || retweetedStatusResult) {
    tw.isRetweet = true;
    tw.retweetedStatusId = retweetedStatusIdStr;
    if (retweetedStatusResult) {
      const parsedResult = parseLegacyTweet(
        retweetedStatusResult?.core?.user_results?.result?.legacy,
        retweetedStatusResult?.legacy
      );
      if (parsedResult.success) {
        tw.retweetedStatus = parsedResult.tweet;
      }
    }
  }
  const views = Number.parseInt(tweet.ext_views?.count ?? "");
  if (!Number.isNaN(views)) {
    tw.views = views;
  }
  if (pinnedTweets.has(tweet.id_str)) {
    tw.isPin = true;
  }
  if (sensitiveContent) {
    tw.sensitiveContent = true;
  }
  tw.html = reconstructTweetHtml(tweet, tw.photos, tw.videos);
  return { success: true, tweet: tw };
}
function parseResult(result) {
  const noteTweetResultText = result?.note_tweet?.note_tweet_results?.result?.text;
  if (result?.legacy && noteTweetResultText) {
    result.legacy.full_text = noteTweetResultText;
  }
  const tweetResult = parseLegacyTweet(result?.core?.user_results?.result?.legacy, result?.legacy);
  if (!tweetResult.success) {
    return tweetResult;
  }
  if (!tweetResult.tweet.views && result?.views?.count) {
    const views = Number.parseInt(result.views.count);
    if (!Number.isNaN(views)) {
      tweetResult.tweet.views = views;
    }
  }
  const quotedResult = result?.quoted_status_result?.result;
  if (quotedResult) {
    if (quotedResult.legacy && quotedResult.rest_id) {
      quotedResult.legacy.id_str = quotedResult.rest_id;
    }
    const quotedTweetResult = parseResult(quotedResult);
    if (quotedTweetResult.success) {
      tweetResult.tweet.quotedStatus = quotedTweetResult.tweet;
    }
  }
  return tweetResult;
}
var expectedEntryTypes = ["tweet", "profile-conversation"];
function parseTimelineTweetsV2(timeline) {
  let bottomCursor;
  let topCursor;
  const tweets = [];
  const instructions = timeline.data?.user?.result?.timeline_v2?.timeline?.instructions ?? [];
  for (const instruction of instructions) {
    const entries = instruction.entries ?? [];
    for (const entry of entries) {
      const entryContent = entry.content;
      if (!entryContent) continue;
      if (entryContent.cursorType === "Bottom") {
        bottomCursor = entryContent.value;
        continue;
      }
      if (entryContent.cursorType === "Top") {
        topCursor = entryContent.value;
        continue;
      }
      const idStr = entry.entryId;
      if (!expectedEntryTypes.some((entryType) => idStr.startsWith(entryType))) {
        continue;
      }
      if (entryContent.itemContent) {
        parseAndPush(tweets, entryContent.itemContent, idStr);
      } else if (entryContent.items) {
        for (const item of entryContent.items) {
          if (item.item?.itemContent) {
            parseAndPush(tweets, item.item.itemContent, idStr);
          }
        }
      }
    }
  }
  return { tweets, next: bottomCursor, previous: topCursor };
}
function parseTimelineEntryItemContentRaw(content, entryId, isConversation = false) {
  let result = content.tweet_results?.result ?? content.tweetResult?.result;
  if (result?.__typename === "Tweet" || result?.__typename === "TweetWithVisibilityResults" && result?.tweet) {
    if (result?.__typename === "TweetWithVisibilityResults") result = result.tweet;
    if (result?.legacy) {
      result.legacy.id_str = result.rest_id ?? entryId.replace("conversation-", "").replace("tweet-", "");
    }
    const tweetResult = parseResult(result);
    if (tweetResult.success) {
      if (isConversation) {
        if (content?.tweetDisplayType === "SelfThread") {
          tweetResult.tweet.isSelfThread = true;
        }
      }
      return tweetResult.tweet;
    }
  }
  return null;
}
function parseAndPush(tweets, content, entryId, isConversation = false) {
  const tweet = parseTimelineEntryItemContentRaw(content, entryId, isConversation);
  if (tweet) {
    tweets.push(tweet);
  }
}
function parseThreadedConversation(conversation) {
  const tweets = [];
  const instructions = conversation.data?.threaded_conversation_with_injections_v2?.instructions ?? [];
  for (const instruction of instructions) {
    const entries = instruction.entries ?? [];
    for (const entry of entries) {
      const entryContent = entry.content?.itemContent;
      if (entryContent) {
        parseAndPush(tweets, entryContent, entry.entryId, true);
      }
      for (const item of entry.content?.items ?? []) {
        const itemContent = item.item?.itemContent;
        if (itemContent) {
          parseAndPush(tweets, itemContent, entry.entryId, true);
        }
      }
    }
  }
  for (const tweet of tweets) {
    if (tweet.inReplyToStatusId) {
      for (const parentTweet of tweets) {
        if (parentTweet.id === tweet.inReplyToStatusId) {
          tweet.inReplyToStatus = parentTweet;
          break;
        }
      }
    }
    if (tweet.isSelfThread && tweet.conversationId === tweet.id) {
      for (const childTweet of tweets) {
        if (childTweet.isSelfThread && childTweet.id !== tweet.id) {
          tweet.thread.push(childTweet);
        }
      }
      if (tweet.thread.length === 0) {
        tweet.isSelfThread = false;
      }
    }
  }
  return tweets;
}
function parseArticle(conversation) {
  const articles = [];
  for (const instruction of conversation.data?.threaded_conversation_with_injections_v2?.instructions ?? []) {
    for (const entry of instruction.entries ?? []) {
      const id = entry.content?.itemContent?.tweet_results?.result?.rest_id;
      const article = entry.content?.itemContent?.tweet_results?.result?.article?.article_results?.result;
      if (!id || !article) continue;
      const text = article.content_state?.blocks?.map((block) => block.text).join("\n\n") ?? "";
      articles.push({
        id,
        articleId: article.rest_id || "",
        coverMediaUrl: article.cover_media?.media_info?.original_img_url,
        previewText: article.preview_text || "",
        text,
        title: article.title || ""
      });
    }
  }
  return articles;
}

// src/client/timeline-search.ts
function parseSearchTimelineTweets(timeline) {
  let bottomCursor;
  let topCursor;
  const tweets = [];
  const instructions = timeline.data?.search_by_raw_query?.search_timeline?.timeline?.instructions ?? [];
  for (const instruction of instructions) {
    if (instruction.type === "TimelineAddEntries" || instruction.type === "TimelineReplaceEntry") {
      if (instruction.entry?.content?.cursorType === "Bottom") {
        bottomCursor = instruction.entry.content.value;
        continue;
      }
      if (instruction.entry?.content?.cursorType === "Top") {
        topCursor = instruction.entry.content.value;
        continue;
      }
      const entries = instruction.entries ?? [];
      for (const entry of entries) {
        const itemContent = entry.content?.itemContent;
        if (itemContent?.tweetDisplayType === "Tweet") {
          const tweetResultRaw = itemContent.tweet_results?.result;
          const tweetResult = parseLegacyTweet(
            tweetResultRaw?.core?.user_results?.result?.legacy,
            tweetResultRaw?.legacy
          );
          if (tweetResult.success) {
            if (!tweetResult.tweet.views && tweetResultRaw?.views?.count) {
              const views = Number.parseInt(tweetResultRaw.views.count);
              if (!Number.isNaN(views)) {
                tweetResult.tweet.views = views;
              }
            }
            tweets.push(tweetResult.tweet);
          }
        } else if (entry.content?.cursorType === "Bottom") {
          bottomCursor = entry.content.value;
        } else if (entry.content?.cursorType === "Top") {
          topCursor = entry.content.value;
        }
      }
    }
  }
  return { tweets, next: bottomCursor, previous: topCursor };
}
function parseSearchTimelineUsers(timeline) {
  let bottomCursor;
  let topCursor;
  const profiles = [];
  const instructions = timeline.data?.search_by_raw_query?.search_timeline?.timeline?.instructions ?? [];
  for (const instruction of instructions) {
    if (instruction.type === "TimelineAddEntries" || instruction.type === "TimelineReplaceEntry") {
      if (instruction.entry?.content?.cursorType === "Bottom") {
        bottomCursor = instruction.entry.content.value;
        continue;
      }
      if (instruction.entry?.content?.cursorType === "Top") {
        topCursor = instruction.entry.content.value;
        continue;
      }
      const entries = instruction.entries ?? [];
      for (const entry of entries) {
        const itemContent = entry.content?.itemContent;
        if (itemContent?.userDisplayType === "User") {
          const userResultRaw = itemContent.user_results?.result;
          if (userResultRaw?.legacy) {
            const profile = parseProfile(userResultRaw.legacy, userResultRaw.is_blue_verified);
            if (!profile.userId) {
              profile.userId = userResultRaw.rest_id;
            }
            profiles.push(profile);
          }
        } else if (entry.content?.cursorType === "Bottom") {
          bottomCursor = entry.content.value;
        } else if (entry.content?.cursorType === "Top") {
          topCursor = entry.content.value;
        }
      }
    }
  }
  return { profiles, next: bottomCursor, previous: topCursor };
}

// src/client/search.ts
function searchTweets(query, maxTweets, searchMode, auth) {
  return getTweetTimeline(query, maxTweets, (q, mt, c) => {
    return fetchSearchTweets(q, mt, searchMode, auth, c);
  });
}
function searchProfiles(query, maxProfiles, auth) {
  return getUserTimeline(query, maxProfiles, (q, mt, c) => {
    return fetchSearchProfiles(q, mt, auth, c);
  });
}
async function fetchSearchTweets(query, maxTweets, searchMode, auth, cursor) {
  const timeline = await getSearchTimeline(query, maxTweets, searchMode, auth, cursor);
  return parseSearchTimelineTweets(timeline);
}
async function fetchSearchProfiles(query, maxProfiles, auth, cursor) {
  const timeline = await getSearchTimeline(query, maxProfiles, 4 /* Users */, auth, cursor);
  return parseSearchTimelineUsers(timeline);
}
async function getSearchTimeline(query, maxItems, searchMode, auth, cursor) {
  if (!auth.isLoggedIn()) {
    throw new Error("Client is not logged-in for search.");
  }
  if (maxItems > 50) {
    maxItems = 50;
  }
  const variables = {
    rawQuery: query,
    count: maxItems,
    querySource: "typed_query",
    product: "Top"
  };
  const features2 = addApiFeatures({
    longform_notetweets_inline_media_enabled: true,
    responsive_web_enhance_cards_enabled: false,
    responsive_web_media_download_video_enabled: false,
    responsive_web_twitter_article_tweet_consumption_enabled: false,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    interactive_text_enabled: false,
    responsive_web_text_conversations_enabled: false,
    vibe_api_enabled: false
  });
  const fieldToggles = {
    withArticleRichContentState: false
  };
  if (cursor != null && cursor !== "") {
    variables.cursor = cursor;
  }
  switch (searchMode) {
    case 1 /* Latest */:
      variables.product = "Latest";
      break;
    case 2 /* Photos */:
      variables.product = "Photos";
      break;
    case 3 /* Videos */:
      variables.product = "Videos";
      break;
    case 4 /* Users */:
      variables.product = "People";
      break;
    default:
      break;
  }
  const params = new URLSearchParams();
  params.set("features", stringify3(features2) ?? "");
  params.set("fieldToggles", stringify3(fieldToggles) ?? "");
  params.set("variables", stringify3(variables) ?? "");
  const res = await requestApi(
    `https://api.twitter.com/graphql/gkjsKepM6gl_HmFWoWKfgg/SearchTimeline?${params.toString()}`,
    auth
  );
  if (!res.success) {
    throw res.err;
  }
  return res.value;
}
async function fetchQuotedTweetsPage(quotedTweetId, maxTweets, auth, cursor) {
  if (maxTweets > 50) {
    maxTweets = 50;
  }
  const variables = {
    rawQuery: `quoted_tweet_id:${quotedTweetId}`,
    count: maxTweets,
    querySource: "tdqt",
    product: "Top"
  };
  if (cursor && cursor !== "") {
    variables.cursor = cursor;
  }
  const features2 = addApiFeatures({
    profile_label_improvements_pcf_label_in_post_enabled: true,
    rweb_tipjar_consumption_enabled: true,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    creator_subscriptions_tweet_preview_api_enabled: true,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    premium_content_api_read_enabled: false,
    communities_web_enable_tweet_community_results_fetch: true,
    c9s_tweet_anatomy_moderator_badge_enabled: true,
    responsive_web_grok_analyze_button_fetch_trends_enabled: false,
    responsive_web_grok_analyze_post_followups_enabled: true,
    responsive_web_jetfuel_frame: false,
    responsive_web_grok_share_attachment_enabled: true,
    articles_preview_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    creator_subscriptions_quote_tweet_preview_enabled: false,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    rweb_video_timestamps_enabled: true,
    longform_notetweets_rich_text_read_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    responsive_web_grok_image_annotation_enabled: false,
    responsive_web_enhance_cards_enabled: false
  });
  const fieldToggles = {
    withArticleRichContentState: false
  };
  const params = new URLSearchParams();
  params.set("features", stringify3(features2) ?? "");
  params.set("fieldToggles", stringify3(fieldToggles) ?? "");
  params.set("variables", stringify3(variables) ?? "");
  const url = `https://x.com/i/api/graphql/1BP5aKg8NvTNvRCyyCyq8g/SearchTimeline?${params.toString()}`;
  const res = await requestApi(url, auth);
  if (!res.success) {
    throw res.err;
  }
  const timeline = res.value;
  return parseSearchTimelineTweets(timeline);
}

// src/client/spaces.ts
function generateRandomId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
async function fetchAudioSpaceById(variables, auth) {
  const queryId = "Tvv_cNXCbtTcgdy1vWYPMw";
  const operationName = "AudioSpaceById";
  const variablesEncoded = encodeURIComponent(JSON.stringify(variables));
  const features2 = {
    spaces_2022_h2_spaces_communities: true,
    spaces_2022_h2_clipping: true,
    creator_subscriptions_tweet_preview_api_enabled: true,
    profile_label_improvements_pcf_label_in_post_enabled: false,
    rweb_tipjar_consumption_enabled: true,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    premium_content_api_read_enabled: false,
    communities_web_enable_tweet_community_results_fetch: true,
    c9s_tweet_anatomy_moderator_badge_enabled: true,
    responsive_web_grok_analyze_button_fetch_trends_enabled: true,
    articles_preview_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    creator_subscriptions_quote_tweet_preview_enabled: false,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    rweb_video_timestamps_enabled: true,
    longform_notetweets_rich_text_read_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_enhance_cards_enabled: false
  };
  const featuresEncoded = encodeURIComponent(JSON.stringify(features2));
  const url = `https://x.com/i/api/graphql/${queryId}/${operationName}?variables=${variablesEncoded}&features=${featuresEncoded}`;
  const onboardingTaskUrl = "https://api.twitter.com/1.1/onboarding/task.json";
  const cookies = await auth.cookieJar().getCookies(onboardingTaskUrl);
  const xCsrfToken = cookies.find((cookie) => cookie.key === "ct0");
  const headers = new Headers({
    Accept: "*/*",
    Authorization: `Bearer ${auth.bearerToken}`,
    "Content-Type": "application/json",
    Cookie: await auth.cookieJar().getCookieString(onboardingTaskUrl),
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "x-guest-token": auth.guestToken,
    "x-twitter-auth-type": "OAuth2Client",
    "x-twitter-active-user": "yes",
    "x-csrf-token": xCsrfToken?.value
  });
  const response = await auth.fetch(url, {
    headers,
    method: "GET"
  });
  await updateCookieJar(auth.cookieJar(), response.headers);
  if (!response.ok) {
    throw new Error(`Failed to fetch Audio Space: ${await response.text()}`);
  }
  const data = await response.json();
  if (data.errors && data.errors.length > 0) {
    throw new Error(`API Errors: ${JSON.stringify(data.errors)}`);
  }
  return data.data.audioSpace;
}
async function fetchBrowseSpaceTopics(auth) {
  const queryId = "TYpVV9QioZfViHqEqRZxJA";
  const operationName = "BrowseSpaceTopics";
  const variables = {};
  const features2 = {};
  const variablesEncoded = encodeURIComponent(JSON.stringify(variables));
  const featuresEncoded = encodeURIComponent(JSON.stringify(features2));
  const url = `https://x.com/i/api/graphql/${queryId}/${operationName}?variables=${variablesEncoded}&features=${featuresEncoded}`;
  const onboardingTaskUrl = "https://api.twitter.com/1.1/onboarding/task.json";
  const cookies = await auth.cookieJar().getCookies(onboardingTaskUrl);
  const xCsrfToken = cookies.find((cookie) => cookie.key === "ct0");
  const headers = new Headers({
    Accept: "*/*",
    Authorization: `Bearer ${auth.bearerToken}`,
    "Content-Type": "application/json",
    Cookie: await auth.cookieJar().getCookieString(onboardingTaskUrl),
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "x-guest-token": auth.guestToken,
    "x-twitter-auth-type": "OAuth2Client",
    "x-twitter-active-user": "yes",
    "x-csrf-token": xCsrfToken?.value
  });
  const response = await auth.fetch(url, {
    headers,
    method: "GET"
  });
  await updateCookieJar(auth.cookieJar(), response.headers);
  if (!response.ok) {
    throw new Error(`Failed to fetch Space Topics: ${await response.text()}`);
  }
  const data = await response.json();
  if (data.errors && data.errors.length > 0) {
    throw new Error(`API Errors: ${JSON.stringify(data.errors)}`);
  }
  return data.data.browse_space_topics.categories.flatMap((category) => category.subtopics);
}
async function fetchCommunitySelectQuery(auth) {
  const queryId = "Lue1DfmoW2cc0225t_8z1w";
  const operationName = "CommunitySelectQuery";
  const variables = {};
  const features2 = {};
  const variablesEncoded = encodeURIComponent(JSON.stringify(variables));
  const featuresEncoded = encodeURIComponent(JSON.stringify(features2));
  const url = `https://x.com/i/api/graphql/${queryId}/${operationName}?variables=${variablesEncoded}&features=${featuresEncoded}`;
  const onboardingTaskUrl = "https://api.twitter.com/1.1/onboarding/task.json";
  const cookies = await auth.cookieJar().getCookies(onboardingTaskUrl);
  const xCsrfToken = cookies.find((cookie) => cookie.key === "ct0");
  const headers = new Headers({
    Accept: "*/*",
    Authorization: `Bearer ${auth.bearerToken}`,
    "Content-Type": "application/json",
    Cookie: await auth.cookieJar().getCookieString(onboardingTaskUrl),
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "x-guest-token": auth.guestToken,
    "x-twitter-auth-type": "OAuth2Client",
    "x-twitter-active-user": "yes",
    "x-csrf-token": xCsrfToken?.value
  });
  const response = await auth.fetch(url, {
    headers,
    method: "GET"
  });
  await updateCookieJar(auth.cookieJar(), response.headers);
  if (!response.ok) {
    throw new Error(`Failed to fetch Community Select Query: ${await response.text()}`);
  }
  const data = await response.json();
  if (data.errors && data.errors.length > 0) {
    throw new Error(`API Errors: ${JSON.stringify(data.errors)}`);
  }
  return data.data.space_hostable_communities;
}
async function fetchLiveVideoStreamStatus(mediaKey, auth) {
  const baseUrl = `https://x.com/i/api/1.1/live_video_stream/status/${mediaKey}`;
  const queryParams = new URLSearchParams({
    client: "web",
    use_syndication_guest_id: "false",
    cookie_set_host: "x.com"
  });
  const url = `${baseUrl}?${queryParams.toString()}`;
  const onboardingTaskUrl = "https://api.twitter.com/1.1/onboarding/task.json";
  const cookies = await auth.cookieJar().getCookies(onboardingTaskUrl);
  const xCsrfToken = cookies.find((cookie) => cookie.key === "ct0");
  const headers = new Headers({
    Accept: "*/*",
    Authorization: `Bearer ${auth.bearerToken}`,
    "Content-Type": "application/json",
    Cookie: await auth.cookieJar().getCookieString(onboardingTaskUrl),
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "x-guest-token": auth.guestToken,
    "x-twitter-auth-type": "OAuth2Client",
    "x-twitter-active-user": "yes",
    "x-csrf-token": xCsrfToken?.value
  });
  try {
    const response = await auth.fetch(url, {
      method: "GET",
      headers
    });
    await updateCookieJar(auth.cookieJar(), response.headers);
    if (!response.ok) {
      throw new Error(`Failed to fetch live video stream status: ${await response.text()}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching live video stream status for mediaKey ${mediaKey}:`, error);
    throw error;
  }
}
async function fetchAuthenticatePeriscope(auth) {
  const queryId = "r7VUmxbfqNkx7uwjgONSNw";
  const operationName = "AuthenticatePeriscope";
  const variables = {};
  const features2 = {};
  const variablesEncoded = encodeURIComponent(JSON.stringify(variables));
  const featuresEncoded = encodeURIComponent(JSON.stringify(features2));
  const url = `https://x.com/i/api/graphql/${queryId}/${operationName}?variables=${variablesEncoded}&features=${featuresEncoded}`;
  const onboardingTaskUrl = "https://api.twitter.com/1.1/onboarding/task.json";
  const cookies = await auth.cookieJar().getCookies(onboardingTaskUrl);
  const xCsrfToken = cookies.find((cookie) => cookie.key === "ct0");
  if (!xCsrfToken) {
    throw new Error("CSRF Token (ct0) not found in cookies.");
  }
  const clientTransactionId = generateRandomId();
  const headers = new Headers({
    Accept: "*/*",
    Authorization: `Bearer ${auth.bearerToken}`,
    "Content-Type": "application/json",
    Cookie: await auth.cookieJar().getCookieString(onboardingTaskUrl),
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "x-guest-token": auth.guestToken,
    "x-twitter-auth-type": "OAuth2Session",
    "x-twitter-active-user": "yes",
    "x-csrf-token": xCsrfToken.value,
    "x-client-transaction-id": clientTransactionId,
    "sec-ch-ua-platform": '"Windows"',
    "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    "x-twitter-client-language": "en",
    "sec-ch-ua-mobile": "?0",
    Referer: "https://x.com/i/spaces/start"
  });
  try {
    const response = await auth.fetch(url, {
      method: "GET",
      headers
    });
    await updateCookieJar(auth.cookieJar(), response.headers);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    if (data.errors && data.errors.length > 0) {
      throw new Error(`API Errors: ${JSON.stringify(data.errors)}`);
    }
    if (!data.data.authenticate_periscope) {
      throw new Error("Periscope authentication failed, no data returned.");
    }
    return data.data.authenticate_periscope;
  } catch (error) {
    console.error("Error during Periscope authentication:", error);
    throw error;
  }
}
async function fetchLoginTwitterToken(jwt, auth) {
  const url = "https://proxsee.pscp.tv/api/v2/loginTwitterToken";
  const idempotenceKey = generateRandomId();
  const payload = {
    jwt,
    vendor_id: "m5-proxsee-login-a2011357b73e",
    create_user: true
  };
  const headers = new Headers({
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    Referer: "https://x.com/",
    "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    "sec-ch-ua-platform": '"Windows"',
    "sec-ch-ua-mobile": "?0",
    "X-Periscope-User-Agent": "Twitter/m5",
    "X-Idempotence": idempotenceKey,
    "X-Attempt": "1"
  });
  try {
    const response = await auth.fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    await updateCookieJar(auth.cookieJar(), response.headers);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    if (!data.cookie || !data.user) {
      throw new Error("Twitter authentication failed, missing data.");
    }
    return data;
  } catch (error) {
    console.error("Error logging into Twitter via Proxsee:", error);
    throw error;
  }
}

// src/client/timeline-following.ts
async function fetchFollowingTimeline(count, seenTweetIds, auth) {
  const variables = {
    count,
    includePromotedContent: true,
    latestControlAvailable: true,
    requestContext: "launch",
    seenTweetIds
  };
  const features2 = {
    profile_label_improvements_pcf_label_in_post_enabled: true,
    rweb_tipjar_consumption_enabled: true,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    creator_subscriptions_tweet_preview_api_enabled: true,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    communities_web_enable_tweet_community_results_fetch: true,
    c9s_tweet_anatomy_moderator_badge_enabled: true,
    articles_preview_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    creator_subscriptions_quote_tweet_preview_enabled: false,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    rweb_video_timestamps_enabled: true,
    longform_notetweets_rich_text_read_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    responsive_web_enhance_cards_enabled: false
  };
  const res = await requestApi(
    `https://x.com/i/api/graphql/K0X1xbCZUjttdK8RazKAlw/HomeLatestTimeline?variables=${encodeURIComponent(
      JSON.stringify(variables)
    )}&features=${encodeURIComponent(JSON.stringify(features2))}`,
    auth,
    "GET"
  );
  if (!res.success) {
    if (res.err instanceof ApiError) {
      console.error("Error details:", res.err.data);
    }
    throw res.err;
  }
  const home = res.value?.data?.home.home_timeline_urt?.instructions;
  if (!home) {
    return [];
  }
  const entries = [];
  for (const instruction of home) {
    if (instruction.type === "TimelineAddEntries") {
      for (const entry of instruction.entries ?? []) {
        entries.push(entry);
      }
    }
  }
  const tweets = entries.map((entry) => entry.content.itemContent?.tweet_results?.result).filter((tweet) => tweet !== void 0);
  return tweets;
}

// src/client/timeline-home.ts
async function fetchHomeTimeline(count, seenTweetIds, auth) {
  const variables = {
    count,
    includePromotedContent: true,
    latestControlAvailable: true,
    requestContext: "launch",
    withCommunity: true,
    seenTweetIds
  };
  const features2 = {
    rweb_tipjar_consumption_enabled: true,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    creator_subscriptions_tweet_preview_api_enabled: true,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    communities_web_enable_tweet_community_results_fetch: true,
    c9s_tweet_anatomy_moderator_badge_enabled: true,
    articles_preview_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    creator_subscriptions_quote_tweet_preview_enabled: false,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    rweb_video_timestamps_enabled: true,
    longform_notetweets_rich_text_read_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    responsive_web_enhance_cards_enabled: false
  };
  const res = await requestApi(
    `https://x.com/i/api/graphql/HJFjzBgCs16TqxewQOeLNg/HomeTimeline?variables=${encodeURIComponent(
      JSON.stringify(variables)
    )}&features=${encodeURIComponent(JSON.stringify(features2))}`,
    auth,
    "GET"
  );
  if (!res.success) {
    if (res.err instanceof ApiError) {
      console.error("Error details:", res.err.data);
    }
    throw res.err;
  }
  const home = res.value?.data?.home.home_timeline_urt?.instructions;
  if (!home) {
    return [];
  }
  const entries = [];
  for (const instruction of home) {
    if (instruction.type === "TimelineAddEntries") {
      for (const entry of instruction.entries ?? []) {
        entries.push(entry);
      }
    }
  }
  const tweets = entries.map((entry) => entry.content.itemContent?.tweet_results?.result).filter((tweet) => tweet !== void 0);
  return tweets;
}

// src/client/trends.ts
async function getTrends(auth) {
  const params = new URLSearchParams();
  addApiParams(params, false);
  params.set("count", "20");
  params.set("candidate_source", "trends");
  params.set("include_page_configuration", "false");
  params.set("entity_tokens", "false");
  const res = await requestApi(
    `https://api.twitter.com/2/guide.json?${params.toString()}`,
    auth
  );
  if (!res.success) {
    throw res.err;
  }
  const instructions = res.value.timeline?.instructions ?? [];
  if (instructions.length < 2) {
    throw new Error("No trend entries found.");
  }
  const entries = instructions[1].addEntries?.entries ?? [];
  if (entries.length < 2) {
    throw new Error("No trend entries found.");
  }
  const items = entries[1].content?.timelineModule?.items ?? [];
  const trends = [];
  for (const item of items) {
    const trend = item.item?.clientEventInfo?.details?.guideDetails?.transparentGuideDetails?.trendMetadata?.trendName;
    if (trend != null) {
      trends.push(trend);
    }
  }
  return trends;
}

// src/client/api-data.ts
import stringify4 from "json-stable-stringify";
var endpoints = {
  // TODO: Migrate other endpoint URLs here
  UserTweets: "https://twitter.com/i/api/graphql/V7H0Ap3_Hh2FyS75OCDO3Q/UserTweets?variables=%7B%22userId%22%3A%224020276615%22%2C%22count%22%3A20%2C%22includePromotedContent%22%3Atrue%2C%22withQuickPromoteEligibilityTweetFields%22%3Atrue%2C%22withVoice%22%3Atrue%2C%22withV2Timeline%22%3Atrue%7D&features=%7B%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22responsive_web_graphql_exclude_directive_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22communities_web_enable_tweet_community_results_fetch%22%3Atrue%2C%22c9s_tweet_anatomy_moderator_badge_enabled%22%3Atrue%2C%22articles_preview_enabled%22%3Atrue%2C%22tweetypie_unmention_optimization_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Atrue%2C%22view_counts_everywhere_api_enabled%22%3Atrue%2C%22longform_notetweets_consumption_enabled%22%3Atrue%2C%22responsive_web_twitter_article_tweet_consumption_enabled%22%3Atrue%2C%22tweet_awards_web_tipping_enabled%22%3Afalse%2C%22creator_subscriptions_quote_tweet_preview_enabled%22%3Afalse%2C%22freedom_of_speech_not_reach_fetch_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Atrue%2C%22rweb_video_timestamps_enabled%22%3Atrue%2C%22longform_notetweets_rich_text_read_enabled%22%3Atrue%2C%22longform_notetweets_inline_media_enabled%22%3Atrue%2C%22responsive_web_enhance_cards_enabled%22%3Afalse%7D&fieldToggles=%7B%22withArticlePlainText%22%3Afalse%7D",
  UserTweetsAndReplies: "https://twitter.com/i/api/graphql/E4wA5vo2sjVyvpliUffSCw/UserTweetsAndReplies?variables=%7B%22userId%22%3A%224020276615%22%2C%22count%22%3A40%2C%22cursor%22%3A%22DAABCgABGPWl-F-ATiIKAAIY9YfiF1rRAggAAwAAAAEAAA%22%2C%22includePromotedContent%22%3Atrue%2C%22withCommunity%22%3Atrue%2C%22withVoice%22%3Atrue%2C%22withV2Timeline%22%3Atrue%7D&features=%7B%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22responsive_web_graphql_exclude_directive_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22communities_web_enable_tweet_community_results_fetch%22%3Atrue%2C%22c9s_tweet_anatomy_moderator_badge_enabled%22%3Atrue%2C%22articles_preview_enabled%22%3Atrue%2C%22tweetypie_unmention_optimization_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Atrue%2C%22view_counts_everywhere_api_enabled%22%3Atrue%2C%22longform_notetweets_consumption_enabled%22%3Atrue%2C%22responsive_web_twitter_article_tweet_consumption_enabled%22%3Atrue%2C%22tweet_awards_web_tipping_enabled%22%3Afalse%2C%22creator_subscriptions_quote_tweet_preview_enabled%22%3Afalse%2C%22freedom_of_speech_not_reach_fetch_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Atrue%2C%22rweb_video_timestamps_enabled%22%3Atrue%2C%22longform_notetweets_rich_text_read_enabled%22%3Atrue%2C%22longform_notetweets_inline_media_enabled%22%3Atrue%2C%22responsive_web_enhance_cards_enabled%22%3Afalse%7D&fieldToggles=%7B%22withArticlePlainText%22%3Afalse%7D",
  UserLikedTweets: "https://twitter.com/i/api/graphql/eSSNbhECHHWWALkkQq-YTA/Likes?variables=%7B%22userId%22%3A%222244196397%22%2C%22count%22%3A20%2C%22includePromotedContent%22%3Afalse%2C%22withClientEventToken%22%3Afalse%2C%22withBirdwatchNotes%22%3Afalse%2C%22withVoice%22%3Atrue%2C%22withV2Timeline%22%3Atrue%7D&features=%7B%22responsive_web_graphql_exclude_directive_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22c9s_tweet_anatomy_moderator_badge_enabled%22%3Atrue%2C%22tweetypie_unmention_optimization_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Atrue%2C%22view_counts_everywhere_api_enabled%22%3Atrue%2C%22longform_notetweets_consumption_enabled%22%3Atrue%2C%22responsive_web_twitter_article_tweet_consumption_enabled%22%3Atrue%2C%22tweet_awards_web_tipping_enabled%22%3Afalse%2C%22freedom_of_speech_not_reach_fetch_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Atrue%2C%22rweb_video_timestamps_enabled%22%3Atrue%2C%22longform_notetweets_rich_text_read_enabled%22%3Atrue%2C%22longform_notetweets_inline_media_enabled%22%3Atrue%2C%22responsive_web_enhance_cards_enabled%22%3Afalse%7D",
  TweetDetail: "https://twitter.com/i/api/graphql/xOhkmRac04YFZmOzU9PJHg/TweetDetail?variables=%7B%22focalTweetId%22%3A%221237110546383724547%22%2C%22with_rux_injections%22%3Afalse%2C%22includePromotedContent%22%3Atrue%2C%22withCommunity%22%3Atrue%2C%22withQuickPromoteEligibilityTweetFields%22%3Atrue%2C%22withBirdwatchNotes%22%3Atrue%2C%22withVoice%22%3Atrue%2C%22withV2Timeline%22%3Atrue%7D&features=%7B%22responsive_web_graphql_exclude_directive_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22tweetypie_unmention_optimization_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Atrue%2C%22view_counts_everywhere_api_enabled%22%3Atrue%2C%22longform_notetweets_consumption_enabled%22%3Atrue%2C%22responsive_web_twitter_article_tweet_consumption_enabled%22%3Afalse%2C%22tweet_awards_web_tipping_enabled%22%3Afalse%2C%22freedom_of_speech_not_reach_fetch_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Atrue%2C%22longform_notetweets_rich_text_read_enabled%22%3Atrue%2C%22longform_notetweets_inline_media_enabled%22%3Atrue%2C%22responsive_web_media_download_video_enabled%22%3Afalse%2C%22responsive_web_enhance_cards_enabled%22%3Afalse%7D&fieldToggles=%7B%22withArticleRichContentState%22%3Afalse%7D",
  TweetDetailArticle: "https://twitter.com/i/api/graphql/GtcBtFhtQymrpxAs5MALVA/TweetDetail?variables=%7B%22focalTweetId%22%3A%221765884209527394325%22%2C%22with_rux_injections%22%3Atrue%2C%22rankingMode%22%3A%22Relevance%22%2C%22includePromotedContent%22%3Atrue%2C%22withCommunity%22%3Atrue%2C%22withQuickPromoteEligibilityTweetFields%22%3Atrue%2C%22withBirdwatchNotes%22%3Atrue%2C%22withVoice%22%3Atrue%7D&features=%7B%22profile_label_improvements_pcf_label_in_post_enabled%22%3Afalse%2C%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22responsive_web_graphql_exclude_directive_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22premium_content_api_read_enabled%22%3Afalse%2C%22communities_web_enable_tweet_community_results_fetch%22%3Atrue%2C%22c9s_tweet_anatomy_moderator_badge_enabled%22%3Atrue%2C%22responsive_web_grok_analyze_button_fetch_trends_enabled%22%3Atrue%2C%22responsive_web_grok_analyze_post_followups_enabled%22%3Afalse%2C%22responsive_web_grok_share_attachment_enabled%22%3Atrue%2C%22articles_preview_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Atrue%2C%22view_counts_everywhere_api_enabled%22%3Atrue%2C%22longform_notetweets_consumption_enabled%22%3Atrue%2C%22responsive_web_twitter_article_tweet_consumption_enabled%22%3Atrue%2C%22tweet_awards_web_tipping_enabled%22%3Afalse%2C%22creator_subscriptions_quote_tweet_preview_enabled%22%3Afalse%2C%22freedom_of_speech_not_reach_fetch_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Atrue%2C%22rweb_video_timestamps_enabled%22%3Atrue%2C%22longform_notetweets_rich_text_read_enabled%22%3Atrue%2C%22longform_notetweets_inline_media_enabled%22%3Atrue%2C%22responsive_web_enhance_cards_enabled%22%3Afalse%7D&fieldToggles=%7B%22withArticleRichContentState%22%3Atrue%2C%22withArticlePlainText%22%3Afalse%2C%22withGrokAnalyze%22%3Afalse%2C%22withDisallowedReplyControls%22%3Afalse%7D",
  TweetResultByRestId: "https://twitter.com/i/api/graphql/DJS3BdhUhcaEpZ7B7irJDg/TweetResultByRestId?variables=%7B%22tweetId%22%3A%221237110546383724547%22%2C%22withCommunity%22%3Afalse%2C%22includePromotedContent%22%3Afalse%2C%22withVoice%22%3Afalse%7D&features=%7B%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22tweetypie_unmention_optimization_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Atrue%2C%22view_counts_everywhere_api_enabled%22%3Atrue%2C%22longform_notetweets_consumption_enabled%22%3Atrue%2C%22responsive_web_twitter_article_tweet_consumption_enabled%22%3Afalse%2C%22tweet_awards_web_tipping_enabled%22%3Afalse%2C%22freedom_of_speech_not_reach_fetch_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Atrue%2C%22longform_notetweets_rich_text_read_enabled%22%3Atrue%2C%22longform_notetweets_inline_media_enabled%22%3Atrue%2C%22responsive_web_graphql_exclude_directive_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22responsive_web_media_download_video_enabled%22%3Afalse%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22responsive_web_enhance_cards_enabled%22%3Afalse%7D",
  ListTweets: "https://twitter.com/i/api/graphql/whF0_KH1fCkdLLoyNPMoEw/ListLatestTweetsTimeline?variables=%7B%22listId%22%3A%221736495155002106192%22%2C%22count%22%3A20%7D&features=%7B%22responsive_web_graphql_exclude_directive_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22c9s_tweet_anatomy_moderator_badge_enabled%22%3Atrue%2C%22tweetypie_unmention_optimization_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Atrue%2C%22view_counts_everywhere_api_enabled%22%3Atrue%2C%22longform_notetweets_consumption_enabled%22%3Atrue%2C%22responsive_web_twitter_article_tweet_consumption_enabled%22%3Afalse%2C%22tweet_awards_web_tipping_enabled%22%3Afalse%2C%22freedom_of_speech_not_reach_fetch_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Atrue%2C%22rweb_video_timestamps_enabled%22%3Atrue%2C%22longform_notetweets_rich_text_read_enabled%22%3Atrue%2C%22longform_notetweets_inline_media_enabled%22%3Atrue%2C%22responsive_web_media_download_video_enabled%22%3Afalse%2C%22responsive_web_enhance_cards_enabled%22%3Afalse%7D"
};
var ApiRequest = class {
  constructor(info) {
    this.url = info.url;
    this.variables = info.variables;
    this.features = info.features;
    this.fieldToggles = info.fieldToggles;
  }
  toRequestUrl() {
    const params = new URLSearchParams();
    if (this.variables) {
      params.set("variables", stringify4(this.variables) ?? "");
    }
    if (this.features) {
      params.set("features", stringify4(this.features) ?? "");
    }
    if (this.fieldToggles) {
      params.set("fieldToggles", stringify4(this.fieldToggles) ?? "");
    }
    return `${this.url}?${params.toString()}`;
  }
};
function parseEndpointExample(example) {
  const { protocol, host, pathname, searchParams: query } = new URL(example);
  const base = `${protocol}//${host}${pathname}`;
  const variables = query.get("variables");
  const features2 = query.get("features");
  const fieldToggles = query.get("fieldToggles");
  return new ApiRequest({
    url: base,
    variables: variables ? JSON.parse(variables) : void 0,
    features: features2 ? JSON.parse(features2) : void 0,
    fieldToggles: fieldToggles ? JSON.parse(fieldToggles) : void 0
  });
}
function createApiRequestFactory(endpoints2) {
  return Object.entries(endpoints2).map(([endpointName, endpointExample]) => {
    return {
      [`create${endpointName}Request`]: () => {
        return parseEndpointExample(endpointExample);
      }
    };
  }).reduce((agg, next) => {
    return Object.assign(agg, next);
  });
}
var apiRequestFactory = createApiRequestFactory(endpoints);

// src/client/timeline-list.ts
function parseListTimelineTweets(timeline) {
  let bottomCursor;
  let topCursor;
  const tweets = [];
  const instructions = timeline.data?.list?.tweets_timeline?.timeline?.instructions ?? [];
  for (const instruction of instructions) {
    const entries = instruction.entries ?? [];
    for (const entry of entries) {
      const entryContent = entry.content;
      if (!entryContent) continue;
      if (entryContent.cursorType === "Bottom") {
        bottomCursor = entryContent.value;
        continue;
      }
      if (entryContent.cursorType === "Top") {
        topCursor = entryContent.value;
        continue;
      }
      const idStr = entry.entryId;
      if (!idStr.startsWith("tweet") && !idStr.startsWith("list-conversation")) {
        continue;
      }
      if (entryContent.itemContent) {
        parseAndPush(tweets, entryContent.itemContent, idStr);
      } else if (entryContent.items) {
        for (const contentItem of entryContent.items) {
          if (contentItem.item?.itemContent && contentItem.entryId) {
            parseAndPush(
              tweets,
              contentItem.item.itemContent,
              contentItem.entryId.split("tweet-")[1]
            );
          }
        }
      }
    }
  }
  return { tweets, next: bottomCursor, previous: topCursor };
}

// src/client/tweets.ts
var defaultOptions = {
  expansions: [
    "attachments.poll_ids",
    "attachments.media_keys",
    "author_id",
    "referenced_tweets.id",
    "in_reply_to_user_id",
    "edit_history_tweet_ids",
    "geo.place_id",
    "entities.mentions.username",
    "referenced_tweets.id.author_id"
  ],
  tweetFields: [
    "attachments",
    "author_id",
    "context_annotations",
    "conversation_id",
    "created_at",
    "entities",
    "geo",
    "id",
    "in_reply_to_user_id",
    "lang",
    "public_metrics",
    "edit_controls",
    "possibly_sensitive",
    "referenced_tweets",
    "reply_settings",
    "source",
    "text",
    "withheld",
    "note_tweet"
  ],
  pollFields: [
    "duration_minutes",
    "end_datetime",
    "id",
    "options",
    "voting_status"
  ],
  mediaFields: [
    "duration_ms",
    "height",
    "media_key",
    "preview_image_url",
    "type",
    "url",
    "width",
    "public_metrics",
    "alt_text",
    "variants"
  ],
  userFields: [
    "created_at",
    "description",
    "entities",
    "id",
    "location",
    "name",
    "profile_image_url",
    "protected",
    "public_metrics",
    "url",
    "username",
    "verified",
    "withheld"
  ],
  placeFields: [
    "contained_within",
    "country",
    "country_code",
    "full_name",
    "geo",
    "id",
    "name",
    "place_type"
  ]
};
var features = addApiFeatures({
  interactive_text_enabled: true,
  longform_notetweets_inline_media_enabled: false,
  responsive_web_text_conversations_enabled: false,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
  vibe_api_enabled: false
});
async function fetchTweets(userId, maxTweets, cursor, auth) {
  if (maxTweets > 200) {
    maxTweets = 200;
  }
  const userTweetsRequest = apiRequestFactory.createUserTweetsRequest();
  userTweetsRequest.variables.userId = userId;
  userTweetsRequest.variables.count = maxTweets;
  userTweetsRequest.variables.includePromotedContent = false;
  if (cursor != null && cursor !== "") {
    userTweetsRequest.variables.cursor = cursor;
  }
  const res = await requestApi(userTweetsRequest.toRequestUrl(), auth);
  if (!res.success) {
    throw res.err;
  }
  return parseTimelineTweetsV2(res.value);
}
async function fetchTweetsAndReplies(userId, maxTweets, cursor, auth) {
  if (maxTweets > 40) {
    maxTweets = 40;
  }
  const userTweetsRequest = apiRequestFactory.createUserTweetsAndRepliesRequest();
  userTweetsRequest.variables.userId = userId;
  userTweetsRequest.variables.count = maxTweets;
  userTweetsRequest.variables.includePromotedContent = false;
  if (cursor != null && cursor !== "") {
    userTweetsRequest.variables.cursor = cursor;
  }
  const res = await requestApi(userTweetsRequest.toRequestUrl(), auth);
  if (!res.success) {
    throw res.err;
  }
  return parseTimelineTweetsV2(res.value);
}
async function createCreateTweetRequestV2(text, auth, tweetId, options) {
  const v2client = auth.getV2Client();
  if (v2client == null) {
    throw new Error("V2 client is not initialized");
  }
  const { poll } = options || {};
  let tweetConfig;
  if (poll) {
    tweetConfig = {
      text,
      poll: {
        options: poll?.options.map((option) => option.label) ?? [],
        duration_minutes: poll?.duration_minutes ?? 60
      }
    };
  } else if (tweetId) {
    tweetConfig = {
      text,
      reply: {
        in_reply_to_tweet_id: tweetId
      }
    };
  } else {
    tweetConfig = {
      text
    };
  }
  const tweetResponse = await v2client.v2.tweet(tweetConfig);
  let optionsConfig = {};
  if (options?.poll) {
    optionsConfig = {
      expansions: ["attachments.poll_ids"],
      pollFields: ["options", "duration_minutes", "end_datetime", "voting_status"]
    };
  }
  return await getTweetV2(tweetResponse.data.id, auth, optionsConfig);
}
function parseTweetV2ToV1(tweetV2, includes, defaultTweetData) {
  let parsedTweet;
  if (defaultTweetData != null) {
    parsedTweet = defaultTweetData;
  }
  parsedTweet = {
    id: tweetV2.id,
    text: tweetV2.text ?? defaultTweetData?.text ?? "",
    hashtags: tweetV2.entities?.hashtags?.map((tag) => tag.tag) ?? defaultTweetData?.hashtags ?? [],
    mentions: tweetV2.entities?.mentions?.map((mention) => ({
      id: mention.id,
      username: mention.username
    })) ?? defaultTweetData?.mentions ?? [],
    urls: tweetV2.entities?.urls?.map((url) => url.url) ?? defaultTweetData?.urls ?? [],
    likes: tweetV2.public_metrics?.like_count ?? defaultTweetData?.likes ?? 0,
    retweets: tweetV2.public_metrics?.retweet_count ?? defaultTweetData?.retweets ?? 0,
    replies: tweetV2.public_metrics?.reply_count ?? defaultTweetData?.replies ?? 0,
    views: tweetV2.public_metrics?.impression_count ?? defaultTweetData?.views ?? 0,
    userId: tweetV2.author_id ?? defaultTweetData?.userId,
    conversationId: tweetV2.conversation_id ?? defaultTweetData?.conversationId,
    photos: defaultTweetData?.photos ?? [],
    videos: defaultTweetData?.videos ?? [],
    poll: defaultTweetData?.poll ?? null,
    username: defaultTweetData?.username ?? "",
    name: defaultTweetData?.name ?? "",
    place: defaultTweetData?.place,
    thread: defaultTweetData?.thread ?? []
  };
  if (includes?.polls?.length) {
    const poll = includes.polls[0];
    parsedTweet.poll = {
      id: poll.id,
      end_datetime: poll.end_datetime ? poll.end_datetime : defaultTweetData?.poll?.end_datetime ? defaultTweetData?.poll?.end_datetime : void 0,
      options: poll.options.map((option) => ({
        position: option.position,
        label: option.label,
        votes: option.votes
      })),
      voting_status: poll.voting_status ?? defaultTweetData?.poll?.voting_status
    };
  }
  if (includes?.media?.length) {
    includes.media.forEach((media) => {
      if (media.type === "photo") {
        parsedTweet.photos.push({
          id: media.media_key,
          url: media.url ?? "",
          alt_text: media.alt_text ?? ""
        });
      } else if (media.type === "video" || media.type === "animated_gif") {
        parsedTweet.videos.push({
          id: media.media_key,
          preview: media.preview_image_url ?? "",
          url: media.variants?.find((variant) => variant.content_type === "video/mp4")?.url ?? ""
        });
      }
    });
  }
  if (includes?.users?.length) {
    const user = includes.users.find((user2) => user2.id === tweetV2.author_id);
    if (user) {
      parsedTweet.username = user.username ?? defaultTweetData?.username ?? "";
      parsedTweet.name = user.name ?? defaultTweetData?.name ?? "";
    }
  }
  if (tweetV2?.geo?.place_id && includes?.places?.length) {
    const place = includes.places.find((place2) => place2.id === tweetV2?.geo?.place_id);
    if (place) {
      parsedTweet.place = {
        id: place.id,
        full_name: place.full_name ?? defaultTweetData?.place?.full_name ?? "",
        country: place.country ?? defaultTweetData?.place?.country ?? "",
        country_code: place.country_code ?? defaultTweetData?.place?.country_code ?? "",
        name: place.name ?? defaultTweetData?.place?.name ?? "",
        place_type: place.place_type ?? defaultTweetData?.place?.place_type
      };
    }
  }
  return parsedTweet;
}
async function createCreateTweetRequest(text, auth, tweetId, mediaData, hideLinkPreview = false) {
  const onboardingTaskUrl = "https://api.twitter.com/1.1/onboarding/task.json";
  const cookies = await auth.cookieJar().getCookies(onboardingTaskUrl);
  const xCsrfToken = cookies.find((cookie) => cookie.key === "ct0");
  const headers = new Headers({
    authorization: `Bearer ${auth.bearerToken}`,
    cookie: await auth.cookieJar().getCookieString(onboardingTaskUrl),
    "content-type": "application/json",
    "User-Agent": "Mozilla/5.0 (Linux; Android 11; Nokia G20) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.88 Mobile Safari/537.36",
    "x-guest-token": auth.guestToken,
    "x-twitter-auth-type": "OAuth2Client",
    "x-twitter-active-user": "yes",
    "x-twitter-client-language": "en",
    "x-csrf-token": xCsrfToken?.value
  });
  const variables = {
    tweet_text: text,
    dark_request: false,
    media: {
      media_entities: [],
      possibly_sensitive: false
    },
    semantic_annotation_ids: []
  };
  if (hideLinkPreview) {
    variables.card_uri = "tombstone://card";
  }
  if (mediaData && mediaData.length > 0) {
    const mediaIds = await Promise.all(
      mediaData.map(({ data, mediaType }) => uploadMedia(data, auth, mediaType))
    );
    variables.media.media_entities = mediaIds.map((id) => ({
      media_id: id,
      tagged_users: []
    }));
  }
  if (tweetId) {
    variables.reply = { in_reply_to_tweet_id: tweetId };
  }
  const response = await fetch(
    "https://twitter.com/i/api/graphql/a1p9RWpkYKBjWv_I3WzS-A/CreateTweet",
    {
      headers,
      body: JSON.stringify({
        variables,
        features: {
          interactive_text_enabled: true,
          longform_notetweets_inline_media_enabled: false,
          responsive_web_text_conversations_enabled: false,
          tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
          vibe_api_enabled: false,
          rweb_lists_timeline_redesign_enabled: true,
          responsive_web_graphql_exclude_directive_enabled: true,
          verified_phone_label_enabled: false,
          creator_subscriptions_tweet_preview_api_enabled: true,
          responsive_web_graphql_timeline_navigation_enabled: true,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          tweetypie_unmention_optimization_enabled: true,
          responsive_web_edit_tweet_api_enabled: true,
          graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
          view_counts_everywhere_api_enabled: true,
          longform_notetweets_consumption_enabled: true,
          tweet_awards_web_tipping_enabled: false,
          freedom_of_speech_not_reach_fetch_enabled: true,
          standardized_nudges_misinfo: true,
          longform_notetweets_rich_text_read_enabled: true,
          responsive_web_enhance_cards_enabled: false,
          subscriptions_verification_info_enabled: true,
          subscriptions_verification_info_reason_enabled: true,
          subscriptions_verification_info_verified_since_enabled: true,
          super_follow_badge_privacy_enabled: false,
          super_follow_exclusive_tweet_notifications_enabled: false,
          super_follow_tweet_api_enabled: false,
          super_follow_user_api_enabled: false,
          android_graphql_skip_api_media_color_palette: false,
          creator_subscriptions_subscription_count_enabled: false,
          blue_business_profile_image_shape_enabled: false,
          unified_cards_ad_metadata_container_dynamic_card_content_query_enabled: false,
          rweb_video_timestamps_enabled: false,
          c9s_tweet_anatomy_moderator_badge_enabled: false,
          responsive_web_twitter_article_tweet_consumption_enabled: false
        },
        fieldToggles: {}
      }),
      method: "POST"
    }
  );
  await updateCookieJar(auth.cookieJar(), response.headers);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response;
}
async function createCreateNoteTweetRequest(text, auth, tweetId, mediaData) {
  const onboardingTaskUrl = "https://api.twitter.com/1.1/onboarding/task.json";
  const cookies = await auth.cookieJar().getCookies(onboardingTaskUrl);
  const xCsrfToken = cookies.find((cookie) => cookie.key === "ct0");
  const headers = new Headers({
    authorization: `Bearer ${auth.bearerToken}`,
    cookie: await auth.cookieJar().getCookieString(onboardingTaskUrl),
    "content-type": "application/json",
    "User-Agent": "Mozilla/5.0 (Linux; Android 11; Nokia G20) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.88 Mobile Safari/537.36",
    "x-guest-token": auth.guestToken,
    "x-twitter-auth-type": "OAuth2Client",
    "x-twitter-active-user": "yes",
    "x-twitter-client-language": "en",
    "x-csrf-token": xCsrfToken?.value
  });
  const variables = {
    tweet_text: text,
    dark_request: false,
    media: {
      media_entities: [],
      possibly_sensitive: false
    },
    semantic_annotation_ids: []
  };
  if (mediaData && mediaData.length > 0) {
    const mediaIds = await Promise.all(
      mediaData.map(({ data: data2, mediaType }) => uploadMedia(data2, auth, mediaType))
    );
    variables.media.media_entities = mediaIds.map((id) => ({
      media_id: id,
      tagged_users: []
    }));
  }
  if (tweetId) {
    variables.reply = { in_reply_to_tweet_id: tweetId };
  }
  const response = await fetch(
    "https://twitter.com/i/api/graphql/0aWhJJmFlxkxv9TAUJPanA/CreateNoteTweet",
    {
      headers,
      body: JSON.stringify({
        variables,
        features: {
          interactive_text_enabled: true,
          longform_notetweets_inline_media_enabled: false,
          responsive_web_text_conversations_enabled: false,
          tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
          vibe_api_enabled: false,
          rweb_lists_timeline_redesign_enabled: true,
          responsive_web_graphql_exclude_directive_enabled: true,
          verified_phone_label_enabled: false,
          creator_subscriptions_tweet_preview_api_enabled: true,
          responsive_web_graphql_timeline_navigation_enabled: true,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          tweetypie_unmention_optimization_enabled: true,
          responsive_web_edit_tweet_api_enabled: true,
          graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
          view_counts_everywhere_api_enabled: true,
          longform_notetweets_consumption_enabled: true,
          longform_notetweets_creation_enabled: true,
          tweet_awards_web_tipping_enabled: false,
          freedom_of_speech_not_reach_fetch_enabled: true,
          standardized_nudges_misinfo: true,
          longform_notetweets_rich_text_read_enabled: true,
          responsive_web_enhance_cards_enabled: false,
          subscriptions_verification_info_enabled: true,
          subscriptions_verification_info_reason_enabled: true,
          subscriptions_verification_info_verified_since_enabled: true,
          super_follow_badge_privacy_enabled: false,
          super_follow_exclusive_tweet_notifications_enabled: false,
          super_follow_tweet_api_enabled: false,
          super_follow_user_api_enabled: false,
          android_graphql_skip_api_media_color_palette: false,
          creator_subscriptions_subscription_count_enabled: false,
          blue_business_profile_image_shape_enabled: false,
          unified_cards_ad_metadata_container_dynamic_card_content_query_enabled: false,
          rweb_video_timestamps_enabled: false,
          c9s_tweet_anatomy_moderator_badge_enabled: false,
          responsive_web_twitter_article_tweet_consumption_enabled: false,
          communities_web_enable_tweet_community_results_fetch: false,
          articles_preview_enabled: false,
          rweb_tipjar_consumption_enabled: false,
          creator_subscriptions_quote_tweet_preview_enabled: false
        },
        fieldToggles: {}
      }),
      method: "POST"
    }
  );
  await updateCookieJar(auth.cookieJar(), response.headers);
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error response:", errorText);
    throw new Error(`Failed to create long tweet: ${errorText}`);
  }
  const data = await response.json();
  return data;
}
async function fetchListTweets(listId, maxTweets, cursor, auth) {
  if (maxTweets > 200) {
    maxTweets = 200;
  }
  const listTweetsRequest = apiRequestFactory.createListTweetsRequest();
  listTweetsRequest.variables.listId = listId;
  listTweetsRequest.variables.count = maxTweets;
  if (cursor != null && cursor !== "") {
    listTweetsRequest.variables.cursor = cursor;
  }
  const res = await requestApi(listTweetsRequest.toRequestUrl(), auth);
  if (!res.success) {
    throw res.err;
  }
  return parseListTimelineTweets(res.value);
}
function getTweets(user, maxTweets, auth) {
  return getTweetTimeline(user, maxTweets, async (q, mt, c) => {
    const userIdRes = await getEntityIdByScreenName(q, auth);
    if (!userIdRes.success) {
      throw userIdRes.err;
    }
    const { value: userId } = userIdRes;
    return fetchTweets(userId, mt, c, auth);
  });
}
function getTweetsByUserId(userId, maxTweets, auth) {
  return getTweetTimeline(userId, maxTweets, (q, mt, c) => {
    return fetchTweets(q, mt, c, auth);
  });
}
function getTweetsAndReplies(user, maxTweets, auth) {
  return getTweetTimeline(user, maxTweets, async (q, mt, c) => {
    const userIdRes = await getEntityIdByScreenName(q, auth);
    if (!userIdRes.success) {
      throw userIdRes.err;
    }
    const { value: userId } = userIdRes;
    return fetchTweetsAndReplies(userId, mt, c, auth);
  });
}
function getTweetsAndRepliesByUserId(userId, maxTweets, auth) {
  return getTweetTimeline(userId, maxTweets, (q, mt, c) => {
    return fetchTweetsAndReplies(q, mt, c, auth);
  });
}
async function getTweetWhere(tweets, query) {
  const isCallback = typeof query === "function";
  for await (const tweet of tweets) {
    const matches = isCallback ? await query(tweet) : checkTweetMatches(tweet, query);
    if (matches) {
      return tweet;
    }
  }
  return null;
}
async function getTweetsWhere(tweets, query) {
  const isCallback = typeof query === "function";
  const filtered = [];
  for await (const tweet of tweets) {
    const matches = isCallback ? query(tweet) : checkTweetMatches(tweet, query);
    if (!matches) continue;
    filtered.push(tweet);
  }
  return filtered;
}
function checkTweetMatches(tweet, options) {
  return Object.keys(options).every((k) => {
    const key = k;
    return tweet[key] === options[key];
  });
}
async function getLatestTweet(user, includeRetweets, max, auth) {
  const timeline = getTweets(user, max, auth);
  return max === 1 ? (await timeline.next()).value : await getTweetWhere(timeline, { isRetweet: includeRetweets });
}
async function getTweet(id, auth) {
  const tweetDetailRequest = apiRequestFactory.createTweetDetailRequest();
  tweetDetailRequest.variables.focalTweetId = id;
  const res = await requestApi(tweetDetailRequest.toRequestUrl(), auth);
  if (!res.success) {
    throw res.err;
  }
  if (!res.value) {
    return null;
  }
  const tweets = parseThreadedConversation(res.value);
  return tweets.find((tweet) => tweet.id === id) ?? null;
}
async function getTweetV2(id, auth, options = defaultOptions) {
  const v2client = auth.getV2Client();
  if (!v2client) {
    throw new Error("V2 client is not initialized");
  }
  try {
    const tweetData = await v2client.v2.singleTweet(id, {
      expansions: options?.expansions,
      "tweet.fields": options?.tweetFields,
      "poll.fields": options?.pollFields,
      "media.fields": options?.mediaFields,
      "user.fields": options?.userFields,
      "place.fields": options?.placeFields
    });
    if (!tweetData?.data) {
      console.warn(`Tweet data not found for ID: ${id}`);
      return null;
    }
    const defaultTweetData = await getTweet(tweetData.data.id, auth);
    const parsedTweet = parseTweetV2ToV1(tweetData.data, tweetData?.includes, defaultTweetData);
    return parsedTweet;
  } catch (error) {
    console.error(`Error fetching tweet ${id}:`, error);
    return null;
  }
}
async function getTweetsV2(ids, auth, options = defaultOptions) {
  const v2client = auth.getV2Client();
  if (!v2client) {
    return [];
  }
  try {
    const tweetData = await v2client.v2.tweets(ids, {
      expansions: options?.expansions,
      "tweet.fields": options?.tweetFields,
      "poll.fields": options?.pollFields,
      "media.fields": options?.mediaFields,
      "user.fields": options?.userFields,
      "place.fields": options?.placeFields
    });
    const tweetsV2 = tweetData.data;
    if (tweetsV2.length === 0) {
      console.warn(`No tweet data found for IDs: ${ids.join(", ")}`);
      return [];
    }
    return (await Promise.all(tweetsV2.map(async (tweet) => await getTweetV2(tweet.id, auth, options)))).filter((tweet) => tweet !== null);
  } catch (error) {
    console.error(`Error fetching tweets for IDs: ${ids.join(", ")}`, error);
    return [];
  }
}
async function getTweetAnonymous(id, auth) {
  const tweetResultByRestIdRequest = apiRequestFactory.createTweetResultByRestIdRequest();
  tweetResultByRestIdRequest.variables.tweetId = id;
  const res = await requestApi(
    tweetResultByRestIdRequest.toRequestUrl(),
    auth
  );
  if (!res.success) {
    throw res.err;
  }
  if (!res.value.data) {
    return null;
  }
  return parseTimelineEntryItemContentRaw(res.value.data, id);
}
async function uploadMedia(mediaData, auth, mediaType) {
  const uploadUrl = "https://upload.twitter.com/1.1/media/upload.json";
  const cookies = await auth.cookieJar().getCookies(uploadUrl);
  const xCsrfToken = cookies.find((cookie) => cookie.key === "ct0");
  const headers = new Headers({
    authorization: `Bearer ${auth.bearerToken}`,
    cookie: await auth.cookieJar().getCookieString(uploadUrl),
    "x-csrf-token": xCsrfToken?.value
  });
  const isVideo = mediaType.startsWith("video/");
  if (isVideo) {
    const mediaId = await uploadVideoInChunks(mediaData, mediaType);
    return mediaId;
  }
  const form = new FormData();
  form.append("media", new Blob([mediaData]));
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers,
    body: form
  });
  await updateCookieJar(auth.cookieJar(), response.headers);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const data = await response.json();
  return data.media_id_string;
  async function uploadVideoInChunks(mediaData2, mediaType2) {
    const initParams = new URLSearchParams();
    initParams.append("command", "INIT");
    initParams.append("media_type", mediaType2);
    initParams.append("total_bytes", mediaData2.length.toString());
    const initResponse = await fetch(uploadUrl, {
      method: "POST",
      headers,
      body: initParams
    });
    if (!initResponse.ok) {
      throw new Error(await initResponse.text());
    }
    const initData = await initResponse.json();
    const mediaId = initData.media_id_string;
    const segmentSize = 5 * 1024 * 1024;
    let segmentIndex = 0;
    for (let offset = 0; offset < mediaData2.length; offset += segmentSize) {
      const chunk = mediaData2.slice(offset, offset + segmentSize);
      const appendForm = new FormData();
      appendForm.append("command", "APPEND");
      appendForm.append("media_id", mediaId);
      appendForm.append("segment_index", segmentIndex.toString());
      appendForm.append("media", new Blob([chunk]));
      const appendResponse = await fetch(uploadUrl, {
        method: "POST",
        headers,
        body: appendForm
      });
      if (!appendResponse.ok) {
        throw new Error(await appendResponse.text());
      }
      segmentIndex++;
    }
    const finalizeParams = new URLSearchParams();
    finalizeParams.append("command", "FINALIZE");
    finalizeParams.append("media_id", mediaId);
    const finalizeResponse = await fetch(uploadUrl, {
      method: "POST",
      headers,
      body: finalizeParams
    });
    if (!finalizeResponse.ok) {
      throw new Error(await finalizeResponse.text());
    }
    const finalizeData = await finalizeResponse.json();
    if (finalizeData.processing_info) {
      await checkUploadStatus(mediaId);
    }
    return mediaId;
  }
  async function checkUploadStatus(mediaId) {
    let processing = true;
    while (processing) {
      await new Promise((resolve) => setTimeout(resolve, 5e3));
      const statusParams = new URLSearchParams();
      statusParams.append("command", "STATUS");
      statusParams.append("media_id", mediaId);
      const statusResponse = await fetch(`${uploadUrl}?${statusParams.toString()}`, {
        method: "GET",
        headers
      });
      if (!statusResponse.ok) {
        throw new Error(await statusResponse.text());
      }
      const statusData = await statusResponse.json();
      const state = statusData.processing_info.state;
      if (state === "succeeded") {
        processing = false;
      } else if (state === "failed") {
        throw new Error("Video processing failed");
      }
    }
  }
}
async function createQuoteTweetRequest(text, quotedTweetId, auth, mediaData) {
  const onboardingTaskUrl = "https://api.twitter.com/1.1/onboarding/task.json";
  const cookies = await auth.cookieJar().getCookies(onboardingTaskUrl);
  const xCsrfToken = cookies.find((cookie) => cookie.key === "ct0");
  const headers = new Headers({
    authorization: `Bearer ${auth.bearerToken}`,
    cookie: await auth.cookieJar().getCookieString(onboardingTaskUrl),
    "content-type": "application/json",
    "User-Agent": "Mozilla/5.0 (Linux; Android 11; Nokia G20) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.88 Mobile Safari/537.36",
    "x-guest-token": auth.guestToken,
    "x-twitter-auth-type": "OAuth2Client",
    "x-twitter-active-user": "yes",
    "x-csrf-token": xCsrfToken?.value
  });
  const variables = {
    tweet_text: text,
    dark_request: false,
    attachment_url: `https://twitter.com/twitter/status/${quotedTweetId}`,
    media: {
      media_entities: [],
      possibly_sensitive: false
    },
    semantic_annotation_ids: []
  };
  if (mediaData && mediaData.length > 0) {
    const mediaIds = await Promise.all(
      mediaData.map(({ data, mediaType }) => uploadMedia(data, auth, mediaType))
    );
    variables.media.media_entities = mediaIds.map((id) => ({
      media_id: id,
      tagged_users: []
    }));
  }
  const response = await fetch(
    "https://twitter.com/i/api/graphql/a1p9RWpkYKBjWv_I3WzS-A/CreateTweet",
    {
      headers,
      body: JSON.stringify({
        variables,
        features: {
          interactive_text_enabled: true,
          longform_notetweets_inline_media_enabled: false,
          responsive_web_text_conversations_enabled: false,
          tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
          vibe_api_enabled: false,
          rweb_lists_timeline_redesign_enabled: true,
          responsive_web_graphql_exclude_directive_enabled: true,
          verified_phone_label_enabled: false,
          creator_subscriptions_tweet_preview_api_enabled: true,
          responsive_web_graphql_timeline_navigation_enabled: true,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          tweetypie_unmention_optimization_enabled: true,
          responsive_web_edit_tweet_api_enabled: true,
          graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
          view_counts_everywhere_api_enabled: true,
          longform_notetweets_consumption_enabled: true,
          tweet_awards_web_tipping_enabled: false,
          freedom_of_speech_not_reach_fetch_enabled: true,
          standardized_nudges_misinfo: true,
          longform_notetweets_rich_text_read_enabled: true,
          responsive_web_enhance_cards_enabled: false,
          subscriptions_verification_info_enabled: true,
          subscriptions_verification_info_reason_enabled: true,
          subscriptions_verification_info_verified_since_enabled: true,
          super_follow_badge_privacy_enabled: false,
          super_follow_exclusive_tweet_notifications_enabled: false,
          super_follow_tweet_api_enabled: false,
          super_follow_user_api_enabled: false,
          android_graphql_skip_api_media_color_palette: false,
          creator_subscriptions_subscription_count_enabled: false,
          blue_business_profile_image_shape_enabled: false,
          unified_cards_ad_metadata_container_dynamic_card_content_query_enabled: false,
          rweb_video_timestamps_enabled: true,
          c9s_tweet_anatomy_moderator_badge_enabled: true,
          responsive_web_twitter_article_tweet_consumption_enabled: false
        },
        fieldToggles: {}
      }),
      method: "POST"
    }
  );
  await updateCookieJar(auth.cookieJar(), response.headers);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response;
}
async function likeTweet(tweetId, auth) {
  const likeTweetUrl = "https://twitter.com/i/api/graphql/lI07N6Otwv1PhnEgXILM7A/FavoriteTweet";
  const cookies = await auth.cookieJar().getCookies(likeTweetUrl);
  const xCsrfToken = cookies.find((cookie) => cookie.key === "ct0");
  const headers = new Headers({
    authorization: `Bearer ${auth.bearerToken}`,
    cookie: await auth.cookieJar().getCookieString(likeTweetUrl),
    "content-type": "application/json",
    "x-guest-token": auth.guestToken,
    "x-twitter-auth-type": "OAuth2Client",
    "x-twitter-active-user": "yes",
    "x-csrf-token": xCsrfToken?.value
  });
  const payload = {
    variables: {
      tweet_id: tweetId
    }
  };
  const response = await fetch(likeTweetUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  await updateCookieJar(auth.cookieJar(), response.headers);
  if (!response.ok) {
    throw new Error(await response.text());
  }
}
async function retweet(tweetId, auth) {
  const retweetUrl = "https://twitter.com/i/api/graphql/ojPdsZsimiJrUGLR1sjUtA/CreateRetweet";
  const cookies = await auth.cookieJar().getCookies(retweetUrl);
  const xCsrfToken = cookies.find((cookie) => cookie.key === "ct0");
  const headers = new Headers({
    authorization: `Bearer ${auth.bearerToken}`,
    cookie: await auth.cookieJar().getCookieString(retweetUrl),
    "content-type": "application/json",
    "x-guest-token": auth.guestToken,
    "x-twitter-auth-type": "OAuth2Client",
    "x-twitter-active-user": "yes",
    "x-csrf-token": xCsrfToken?.value
  });
  const payload = {
    variables: {
      tweet_id: tweetId,
      dark_request: false
    }
  };
  const response = await fetch(retweetUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  await updateCookieJar(auth.cookieJar(), response.headers);
  if (!response.ok) {
    throw new Error(await response.text());
  }
}
async function createCreateLongTweetRequest(text, auth, tweetId, mediaData) {
  const url = "https://x.com/i/api/graphql/YNXM2DGuE2Sff6a2JD3Ztw/CreateNoteTweet";
  const onboardingTaskUrl = "https://api.twitter.com/1.1/onboarding/task.json";
  const cookies = await auth.cookieJar().getCookies(onboardingTaskUrl);
  const xCsrfToken = cookies.find((cookie) => cookie.key === "ct0");
  const headers = new Headers({
    authorization: `Bearer ${auth.bearerToken}`,
    cookie: await auth.cookieJar().getCookieString(onboardingTaskUrl),
    "content-type": "application/json",
    "User-Agent": "Mozilla/5.0 (Linux; Android 11; Nokia G20) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.88 Mobile Safari/537.36",
    "x-guest-token": auth.guestToken,
    "x-twitter-auth-type": "OAuth2Client",
    "x-twitter-active-user": "yes",
    "x-twitter-client-language": "en",
    "x-csrf-token": xCsrfToken?.value
  });
  const variables = {
    tweet_text: text,
    dark_request: false,
    media: {
      media_entities: [],
      possibly_sensitive: false
    },
    semantic_annotation_ids: []
  };
  if (mediaData && mediaData.length > 0) {
    const mediaIds = await Promise.all(
      mediaData.map(({ data, mediaType }) => uploadMedia(data, auth, mediaType))
    );
    variables.media.media_entities = mediaIds.map((id) => ({
      media_id: id,
      tagged_users: []
    }));
  }
  if (tweetId) {
    variables.reply = { in_reply_to_tweet_id: tweetId };
  }
  const features2 = {
    premium_content_api_read_enabled: false,
    communities_web_enable_tweet_community_results_fetch: true,
    c9s_tweet_anatomy_moderator_badge_enabled: true,
    responsive_web_grok_analyze_button_fetch_trends_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    creator_subscriptions_quote_tweet_preview_enabled: false,
    longform_notetweets_rich_text_read_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    profile_label_improvements_pcf_label_in_post_enabled: false,
    rweb_tipjar_consumption_enabled: true,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    articles_preview_enabled: true,
    rweb_video_timestamps_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_enhance_cards_enabled: false
  };
  const response = await fetch(url, {
    headers,
    body: JSON.stringify({
      variables,
      features: features2,
      queryId: "YNXM2DGuE2Sff6a2JD3Ztw"
    }),
    method: "POST"
  });
  await updateCookieJar(auth.cookieJar(), response.headers);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response;
}
async function getArticle(id, auth) {
  const tweetDetailRequest = apiRequestFactory.createTweetDetailArticleRequest();
  tweetDetailRequest.variables.focalTweetId = id;
  const res = await requestApi(tweetDetailRequest.toRequestUrl(), auth);
  if (!res.success) {
    throw res.err;
  }
  if (!res.value) {
    return null;
  }
  const articles = parseArticle(res.value);
  return articles.find((article) => article.id === id) ?? null;
}
async function fetchRetweetersPage(tweetId, auth, cursor, count = 40) {
  const baseUrl = "https://twitter.com/i/api/graphql/VSnHXwLGADxxtetlPnO7xg/Retweeters";
  const variables = {
    tweetId,
    count,
    cursor,
    includePromotedContent: true
  };
  const features2 = {
    profile_label_improvements_pcf_label_in_post_enabled: true,
    rweb_tipjar_consumption_enabled: true,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    creator_subscriptions_tweet_preview_api_enabled: true,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    premium_content_api_read_enabled: false,
    communities_web_enable_tweet_community_results_fetch: true,
    c9s_tweet_anatomy_moderator_badge_enabled: true,
    responsive_web_grok_analyze_button_fetch_trends_enabled: false,
    responsive_web_grok_analyze_post_followups_enabled: true,
    responsive_web_jetfuel_frame: false,
    responsive_web_grok_share_attachment_enabled: true,
    articles_preview_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    creator_subscriptions_quote_tweet_preview_enabled: false,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    rweb_video_timestamps_enabled: true,
    longform_notetweets_rich_text_read_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    responsive_web_grok_image_annotation_enabled: false,
    responsive_web_enhance_cards_enabled: false
  };
  const url = new URL(baseUrl);
  url.searchParams.set("variables", JSON.stringify(variables));
  url.searchParams.set("features", JSON.stringify(features2));
  const cookies = await auth.cookieJar().getCookies(url.toString());
  const xCsrfToken = cookies.find((cookie) => cookie.key === "ct0");
  const headers = new Headers({
    authorization: `Bearer ${auth.bearerToken}`,
    cookie: await auth.cookieJar().getCookieString(url.toString()),
    "content-type": "application/json",
    "x-guest-token": auth.guestToken,
    "x-twitter-auth-type": "OAuth2Client",
    "x-twitter-active-user": "yes",
    "x-csrf-token": xCsrfToken?.value || ""
  });
  const response = await fetch(url.toString(), {
    method: "GET",
    headers
  });
  await updateCookieJar(auth.cookieJar(), response.headers);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const json = await response.json();
  const instructions = json?.data?.retweeters_timeline?.timeline?.instructions || [];
  const retweeters = [];
  let bottomCursor;
  let topCursor;
  for (const instruction of instructions) {
    if (instruction.type === "TimelineAddEntries") {
      for (const entry of instruction.entries) {
        if (entry.content?.itemContent?.user_results?.result) {
          const user = entry.content.itemContent.user_results.result;
          const description = user.legacy?.name ?? "";
          retweeters.push({
            rest_id: user.rest_id,
            screen_name: user.legacy?.screen_name ?? "",
            name: user.legacy?.name ?? "",
            description
          });
        }
        if (entry.content?.entryType === "TimelineTimelineCursor" && entry.content?.cursorType === "Bottom") {
          bottomCursor = entry.content.value;
        }
        if (entry.content?.entryType === "TimelineTimelineCursor" && entry.content?.cursorType === "Top") {
          topCursor = entry.content.value;
        }
      }
    }
  }
  return { retweeters, bottomCursor, topCursor };
}
async function getAllRetweeters(tweetId, auth) {
  let allRetweeters = [];
  let cursor;
  while (true) {
    const { retweeters, bottomCursor, topCursor } = await fetchRetweetersPage(
      tweetId,
      auth,
      cursor,
      40
    );
    allRetweeters = allRetweeters.concat(retweeters);
    const newCursor = bottomCursor || topCursor;
    if (!newCursor || newCursor === cursor) {
      break;
    }
    cursor = newCursor;
  }
  return allRetweeters;
}

// src/client/client.ts
var twUrl = "https://twitter.com";
var UserTweetsUrl = "https://twitter.com/i/api/graphql/E3opETHurmVJflFsUBVuUQ/UserTweets";
var Client = class {
  /**
   * Creates a new Client object.
   * - Clients maintain their own guest tokens for Twitter's internal API.
   * - Reusing Client objects is recommended to minimize the time spent authenticating unnecessarily.
   */
  constructor(options) {
    this.options = options;
    this.token = bearerToken;
    this.useGuestAuth();
  }
  /**
   * Initializes auth properties using a guest token.
   * Used when creating a new instance of this class, and when logging out.
   * @internal
   */
  useGuestAuth() {
    this.auth = new TwitterGuestAuth(this.token, this.getAuthOptions());
    this.authTrends = new TwitterGuestAuth(this.token, this.getAuthOptions());
  }
  /**
   * Fetches a Twitter profile.
   * @param username The Twitter username of the profile to fetch, without an `@` at the beginning.
   * @returns The requested {@link Profile}.
   */
  async getProfile(username) {
    const res = await getProfile(username, this.auth);
    return this.handleResponse(res);
  }
  /**
   * Fetches the user ID corresponding to the provided screen name.
   * @param screenName The Twitter screen name of the profile to fetch.
   * @returns The ID of the corresponding account.
   */
  async getEntityIdByScreenName(screenName) {
    const res = await getEntityIdByScreenName(screenName, this.auth);
    return this.handleResponse(res);
  }
  /**
   *
   * @param userId The user ID of the profile to fetch.
   * @returns The screen name of the corresponding account.
   */
  async getScreenNameByUserId(userId) {
    const response = await getScreenNameByUserId(userId, this.auth);
    return this.handleResponse(response);
  }
  /**
   * Fetches tweets from Twitter.
   * @param query The search query. Any Twitter-compatible query format can be used.
   * @param maxTweets The maximum number of tweets to return.
   * @param includeReplies Whether or not replies should be included in the response.
   * @param searchMode The category filter to apply to the search. Defaults to `Top`.
   * @returns An {@link AsyncGenerator} of tweets matching the provided filters.
   */
  searchTweets(query, maxTweets, searchMode = 0 /* Top */) {
    return searchTweets(query, maxTweets, searchMode, this.auth);
  }
  /**
   * Fetches profiles from Twitter.
   * @param query The search query. Any Twitter-compatible query format can be used.
   * @param maxProfiles The maximum number of profiles to return.
   * @returns An {@link AsyncGenerator} of tweets matching the provided filter(s).
   */
  searchProfiles(query, maxProfiles) {
    return searchProfiles(query, maxProfiles, this.auth);
  }
  /**
   * Fetches tweets from Twitter.
   * @param query The search query. Any Twitter-compatible query format can be used.
   * @param maxTweets The maximum number of tweets to return.
   * @param includeReplies Whether or not replies should be included in the response.
   * @param searchMode The category filter to apply to the search. Defaults to `Top`.
   * @param cursor The search cursor, which can be passed into further requests for more results.
   * @returns A page of results, containing a cursor that can be used in further requests.
   */
  fetchSearchTweets(query, maxTweets, searchMode, cursor) {
    return fetchSearchTweets(query, maxTweets, searchMode, this.auth, cursor);
  }
  /**
   * Fetches profiles from Twitter.
   * @param query The search query. Any Twitter-compatible query format can be used.
   * @param maxProfiles The maximum number of profiles to return.
   * @param cursor The search cursor, which can be passed into further requests for more results.
   * @returns A page of results, containing a cursor that can be used in further requests.
   */
  fetchSearchProfiles(query, maxProfiles, cursor) {
    return fetchSearchProfiles(query, maxProfiles, this.auth, cursor);
  }
  /**
   * Fetches list tweets from Twitter.
   * @param listId The list id
   * @param maxTweets The maximum number of tweets to return.
   * @param cursor The search cursor, which can be passed into further requests for more results.
   * @returns A page of results, containing a cursor that can be used in further requests.
   */
  fetchListTweets(listId, maxTweets, cursor) {
    return fetchListTweets(listId, maxTweets, cursor, this.auth);
  }
  /**
   * Fetch the profiles a user is following
   * @param userId The user whose following should be returned
   * @param maxProfiles The maximum number of profiles to return.
   * @returns An {@link AsyncGenerator} of following profiles for the provided user.
   */
  getFollowing(userId, maxProfiles) {
    return getFollowing(userId, maxProfiles, this.auth);
  }
  /**
   * Fetch the profiles that follow a user
   * @param userId The user whose followers should be returned
   * @param maxProfiles The maximum number of profiles to return.
   * @returns An {@link AsyncGenerator} of profiles following the provided user.
   */
  getFollowers(userId, maxProfiles) {
    return getFollowers(userId, maxProfiles, this.auth);
  }
  /**
   * Fetches following profiles from Twitter.
   * @param userId The user whose following should be returned
   * @param maxProfiles The maximum number of profiles to return.
   * @param cursor The search cursor, which can be passed into further requests for more results.
   * @returns A page of results, containing a cursor that can be used in further requests.
   */
  fetchProfileFollowing(userId, maxProfiles, cursor) {
    return fetchProfileFollowing(userId, maxProfiles, this.auth, cursor);
  }
  /**
   * Fetches profile followers from Twitter.
   * @param userId The user whose following should be returned
   * @param maxProfiles The maximum number of profiles to return.
   * @param cursor The search cursor, which can be passed into further requests for more results.
   * @returns A page of results, containing a cursor that can be used in further requests.
   */
  fetchProfileFollowers(userId, maxProfiles, cursor) {
    return fetchProfileFollowers(userId, maxProfiles, this.auth, cursor);
  }
  /**
   * Fetches the home timeline for the current user. (for you feed)
   * @param count The number of tweets to fetch.
   * @param seenTweetIds An array of tweet IDs that have already been seen.
   * @returns A promise that resolves to the home timeline response.
   */
  async fetchHomeTimeline(count, seenTweetIds) {
    return await fetchHomeTimeline(count, seenTweetIds, this.auth);
  }
  /**
   * Fetches the home timeline for the current user. (following feed)
   * @param count The number of tweets to fetch.
   * @param seenTweetIds An array of tweet IDs that have already been seen.
   * @returns A promise that resolves to the home timeline response.
   */
  async fetchFollowingTimeline(count, seenTweetIds) {
    return await fetchFollowingTimeline(count, seenTweetIds, this.auth);
  }
  async getUserTweets(userId, maxTweets = 200, cursor) {
    if (maxTweets > 200) {
      maxTweets = 200;
    }
    const variables = {
      userId,
      count: maxTweets,
      includePromotedContent: true,
      withQuickPromoteEligibilityTweetFields: true,
      withVoice: true,
      withV2Timeline: true
    };
    if (cursor) {
      variables.cursor = cursor;
    }
    const features2 = {
      rweb_tipjar_consumption_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      communities_web_enable_tweet_community_results_fetch: true,
      c9s_tweet_anatomy_moderator_badge_enabled: true,
      articles_preview_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: true,
      tweet_awards_web_tipping_enabled: false,
      creator_subscriptions_quote_tweet_preview_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
      rweb_video_timestamps_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      responsive_web_enhance_cards_enabled: false
    };
    const fieldToggles = {
      withArticlePlainText: false
    };
    const res = await requestApi(
      `${UserTweetsUrl}?variables=${encodeURIComponent(
        JSON.stringify(variables)
      )}&features=${encodeURIComponent(
        JSON.stringify(features2)
      )}&fieldToggles=${encodeURIComponent(JSON.stringify(fieldToggles))}`,
      this.auth
    );
    if (!res.success) {
      throw res.err;
    }
    const timelineV2 = parseTimelineTweetsV2(res.value);
    return {
      tweets: timelineV2.tweets,
      next: timelineV2.next
    };
  }
  async *getUserTweetsIterator(userId, maxTweets = 200) {
    let cursor;
    let retrievedTweets = 0;
    while (retrievedTweets < maxTweets) {
      const response = await this.getUserTweets(userId, maxTweets - retrievedTweets, cursor);
      for (const tweet of response.tweets) {
        yield tweet;
        retrievedTweets++;
        if (retrievedTweets >= maxTweets) {
          break;
        }
      }
      cursor = response.next;
      if (!cursor) {
        break;
      }
    }
  }
  /**
   * Fetches the current trends from Twitter.
   * @returns The current list of trends.
   */
  getTrends() {
    return getTrends(this.authTrends);
  }
  /**
   * Fetches tweets from a Twitter user.
   * @param user The user whose tweets should be returned.
   * @param maxTweets The maximum number of tweets to return. Defaults to `200`.
   * @returns An {@link AsyncGenerator} of tweets from the provided user.
   */
  getTweets(user, maxTweets = 200) {
    return getTweets(user, maxTweets, this.auth);
  }
  /**
   * Fetches tweets from a Twitter user using their ID.
   * @param userId The user whose tweets should be returned.
   * @param maxTweets The maximum number of tweets to return. Defaults to `200`.
   * @returns An {@link AsyncGenerator} of tweets from the provided user.
   */
  getTweetsByUserId(userId, maxTweets = 200) {
    return getTweetsByUserId(userId, maxTweets, this.auth);
  }
  /**
   * Send a tweet
   * @param text The text of the tweet
   * @param tweetId The id of the tweet to reply to
   * @param mediaData Optional media data
   * @returns
   */
  async sendTweet(text, replyToTweetId, mediaData, hideLinkPreview) {
    return await createCreateTweetRequest(
      text,
      this.auth,
      replyToTweetId,
      mediaData,
      hideLinkPreview
    );
  }
  async sendNoteTweet(text, replyToTweetId, mediaData) {
    return await createCreateNoteTweetRequest(text, this.auth, replyToTweetId, mediaData);
  }
  /**
   * Send a long tweet (Note Tweet)
   * @param text The text of the tweet
   * @param tweetId The id of the tweet to reply to
   * @param mediaData Optional media data
   * @returns
   */
  async sendLongTweet(text, replyToTweetId, mediaData) {
    return await createCreateLongTweetRequest(text, this.auth, replyToTweetId, mediaData);
  }
  /**
   * Send a tweet
   * @param text The text of the tweet
   * @param tweetId The id of the tweet to reply to
   * @param options The options for the tweet
   * @returns
   */
  async sendTweetV2(text, replyToTweetId, options) {
    return await createCreateTweetRequestV2(text, this.auth, replyToTweetId, options);
  }
  /**
   * Fetches tweets and replies from a Twitter user.
   * @param user The user whose tweets should be returned.
   * @param maxTweets The maximum number of tweets to return. Defaults to `200`.
   * @returns An {@link AsyncGenerator} of tweets from the provided user.
   */
  getTweetsAndReplies(user, maxTweets = 200) {
    return getTweetsAndReplies(user, maxTweets, this.auth);
  }
  /**
   * Fetches tweets and replies from a Twitter user using their ID.
   * @param userId The user whose tweets should be returned.
   * @param maxTweets The maximum number of tweets to return. Defaults to `200`.
   * @returns An {@link AsyncGenerator} of tweets from the provided user.
   */
  getTweetsAndRepliesByUserId(userId, maxTweets = 200) {
    return getTweetsAndRepliesByUserId(userId, maxTweets, this.auth);
  }
  /**
   * Fetches the first tweet matching the given query.
   *
   * Example:
   * ```js
   * const timeline = client.getTweets('user', 200);
   * const retweet = await client.getTweetWhere(timeline, { isRetweet: true });
   * ```
   * @param tweets The {@link AsyncIterable} of tweets to search through.
   * @param query A query to test **all** tweets against. This may be either an
   * object of key/value pairs or a predicate. If this query is an object, all
   * key/value pairs must match a {@link Tweet} for it to be returned. If this query
   * is a predicate, it must resolve to `true` for a {@link Tweet} to be returned.
   * - All keys are optional.
   * - If specified, the key must be implemented by that of {@link Tweet}.
   */
  getTweetWhere(tweets, query) {
    return getTweetWhere(tweets, query);
  }
  /**
   * Fetches all tweets matching the given query.
   *
   * Example:
   * ```js
   * const timeline = client.getTweets('user', 200);
   * const retweets = await client.getTweetsWhere(timeline, { isRetweet: true });
   * ```
   * @param tweets The {@link AsyncIterable} of tweets to search through.
   * @param query A query to test **all** tweets against. This may be either an
   * object of key/value pairs or a predicate. If this query is an object, all
   * key/value pairs must match a {@link Tweet} for it to be returned. If this query
   * is a predicate, it must resolve to `true` for a {@link Tweet} to be returned.
   * - All keys are optional.
   * - If specified, the key must be implemented by that of {@link Tweet}.
   */
  getTweetsWhere(tweets, query) {
    return getTweetsWhere(tweets, query);
  }
  /**
   * Fetches the most recent tweet from a Twitter user.
   * @param user The user whose latest tweet should be returned.
   * @param includeRetweets Whether or not to include retweets. Defaults to `false`.
   * @returns The {@link Tweet} object or `null`/`undefined` if it couldn't be fetched.
   */
  getLatestTweet(user, includeRetweets = false, max = 200) {
    return getLatestTweet(user, includeRetweets, max, this.auth);
  }
  /**
   * Fetches a single tweet.
   * @param id The ID of the tweet to fetch.
   * @returns The {@link Tweet} object, or `null` if it couldn't be fetched.
   */
  getTweet(id) {
    if (this.auth instanceof TwitterUserAuth) {
      return getTweet(id, this.auth);
    }
    return getTweetAnonymous(id, this.auth);
  }
  /**
   * Fetches a single tweet by ID using the Twitter API v2.
   * Allows specifying optional expansions and fields for more detailed data.
   *
   * @param {string} id - The ID of the tweet to fetch.
   * @param {Object} [options] - Optional parameters to customize the tweet data.
   * @param {string[]} [options.expansions] - Array of expansions to include, e.g., 'attachments.poll_ids'.
   * @param {string[]} [options.tweetFields] - Array of tweet fields to include, e.g., 'created_at', 'public_metrics'.
   * @param {string[]} [options.pollFields] - Array of poll fields to include, if the tweet has a poll, e.g., 'options', 'end_datetime'.
   * @param {string[]} [options.mediaFields] - Array of media fields to include, if the tweet includes media, e.g., 'url', 'preview_image_url'.
   * @param {string[]} [options.userFields] - Array of user fields to include, if user information is requested, e.g., 'username', 'verified'.
   * @param {string[]} [options.placeFields] - Array of place fields to include, if the tweet includes location data, e.g., 'full_name', 'country'.
   * @returns {Promise<TweetV2 | null>} - The tweet data, including requested expansions and fields.
   */
  async getTweetV2(id, options = defaultOptions) {
    return await getTweetV2(id, this.auth, options);
  }
  /**
   * Fetches multiple tweets by IDs using the Twitter API v2.
   * Allows specifying optional expansions and fields for more detailed data.
   *
   * @param {string[]} ids - Array of tweet IDs to fetch.
   * @param {Object} [options] - Optional parameters to customize the tweet data.
   * @param {string[]} [options.expansions] - Array of expansions to include, e.g., 'attachments.poll_ids'.
   * @param {string[]} [options.tweetFields] - Array of tweet fields to include, e.g., 'created_at', 'public_metrics'.
   * @param {string[]} [options.pollFields] - Array of poll fields to include, if tweets contain polls, e.g., 'options', 'end_datetime'.
   * @param {string[]} [options.mediaFields] - Array of media fields to include, if tweets contain media, e.g., 'url', 'preview_image_url'.
   * @param {string[]} [options.userFields] - Array of user fields to include, if user information is requested, e.g., 'username', 'verified'.
   * @param {string[]} [options.placeFields] - Array of place fields to include, if tweets contain location data, e.g., 'full_name', 'country'.
   * @returns {Promise<TweetV2[]> } - Array of tweet data, including requested expansions and fields.
   */
  async getTweetsV2(ids, options = defaultOptions) {
    return await getTweetsV2(ids, this.auth, options);
  }
  /**
   * Returns if the client has a guest token. The token may not be valid.
   * @returns `true` if the client has a guest token; otherwise `false`.
   */
  hasGuestToken() {
    return this.auth.hasToken() || this.authTrends.hasToken();
  }
  /**
   * Returns if the client is logged in as a real user.
   * @returns `true` if the client is logged in with a real user account; otherwise `false`.
   */
  async isLoggedIn() {
    return await this.auth.isLoggedIn() && await this.authTrends.isLoggedIn();
  }
  /**
   * Returns the currently logged in user
   * @returns The currently logged in user
   */
  async me() {
    return this.auth.me();
  }
  /**
   * Login to Twitter as a real Twitter account. This enables running
   * searches.
   * @param username The username of the Twitter account to login with.
   * @param password The password of the Twitter account to login with.
   * @param email The email to log in with, if you have email confirmation enabled.
   * @param twoFactorSecret The secret to generate two factor authentication tokens with, if you have two factor authentication enabled.
   */
  async login(username, password, email, twoFactorSecret, appKey, appSecret, accessToken, accessSecret) {
    const userAuth = new TwitterUserAuth(this.token, this.getAuthOptions());
    await userAuth.login(
      username,
      password,
      email,
      twoFactorSecret,
      appKey,
      appSecret,
      accessToken,
      accessSecret
    );
    this.auth = userAuth;
    this.authTrends = userAuth;
  }
  /**
   * Log out of Twitter.
   */
  async logout() {
    await this.auth.logout();
    await this.authTrends.logout();
    this.useGuestAuth();
  }
  /**
   * Retrieves all cookies for the current session.
   * @returns All cookies for the current session.
   */
  async getCookies() {
    return await this.authTrends.cookieJar().getCookies(typeof document !== "undefined" ? document.location.toString() : twUrl);
  }
  /**
   * Set cookies for the current session.
   * @param cookies The cookies to set for the current session.
   */
  async setCookies(cookies) {
    const userAuth = new TwitterUserAuth(this.token, this.getAuthOptions());
    for (const cookie of cookies) {
      await userAuth.cookieJar().setCookie(cookie, twUrl);
    }
    this.auth = userAuth;
    this.authTrends = userAuth;
  }
  /**
   * Clear all cookies for the current session.
   */
  async clearCookies() {
    await this.auth.cookieJar().removeAllCookies();
    await this.authTrends.cookieJar().removeAllCookies();
  }
  /**
   * Sets the optional cookie to be used in requests.
   * @param _cookie The cookie to be used in requests.
   * @deprecated This function no longer represents any part of Twitter's auth flow.
   * @returns This client instance.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  withCookie(_cookie) {
    console.warn(
      "Warning: Client#withCookie is deprecated and will be removed in a later version. Use Client#login or Client#setCookies instead."
    );
    return this;
  }
  /**
   * Sets the optional CSRF token to be used in requests.
   * @param _token The CSRF token to be used in requests.
   * @deprecated This function no longer represents any part of Twitter's auth flow.
   * @returns This client instance.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  withXCsrfToken(_token) {
    console.warn(
      "Warning: Client#withXCsrfToken is deprecated and will be removed in a later version."
    );
    return this;
  }
  /**
   * Sends a quote tweet.
   * @param text The text of the tweet.
   * @param quotedTweetId The ID of the tweet to quote.
   * @param options Optional parameters, such as media data.
   * @returns The response from the Twitter API.
   */
  async sendQuoteTweet(text, quotedTweetId, options) {
    return await createQuoteTweetRequest(text, quotedTweetId, this.auth, options?.mediaData);
  }
  /**
   * Likes a tweet with the given tweet ID.
   * @param tweetId The ID of the tweet to like.
   * @returns A promise that resolves when the tweet is liked.
   */
  async likeTweet(tweetId) {
    await likeTweet(tweetId, this.auth);
  }
  /**
   * Retweets a tweet with the given tweet ID.
   * @param tweetId The ID of the tweet to retweet.
   * @returns A promise that resolves when the tweet is retweeted.
   */
  async retweet(tweetId) {
    await retweet(tweetId, this.auth);
  }
  /**
   * Follows a user with the given user ID.
   * @param userId The user ID of the user to follow.
   * @returns A promise that resolves when the user is followed.
   */
  async followUser(userName) {
    await followUser(userName, this.auth);
  }
  /**
   * Fetches direct message conversations
   * @param count Number of conversations to fetch (default: 50)
   * @param cursor Pagination cursor for fetching more conversations
   * @returns Array of DM conversations and other details
   */
  async getDirectMessageConversations(userId, cursor) {
    return await getDirectMessageConversations(userId, this.auth, cursor);
  }
  /**
   * Sends a direct message to a user.
   * @param conversationId The ID of the conversation to send the message to.
   * @param text The text of the message to send.
   * @returns The response from the Twitter API.
   */
  async sendDirectMessage(conversationId, text) {
    return await sendDirectMessage(this.auth, conversationId, text);
  }
  getAuthOptions() {
    return {
      fetch: this.options?.fetch,
      transform: this.options?.transform
    };
  }
  handleResponse(res) {
    if (!res.success) {
      throw res.err;
    }
    return res.value;
  }
  /**
   * Retrieves the details of an Audio Space by its ID.
   * @param id The ID of the Audio Space.
   * @returns The details of the Audio Space.
   */
  async getAudioSpaceById(id) {
    const variables = {
      id,
      isMetatagsQuery: false,
      withReplays: true,
      withListeners: true
    };
    return await fetchAudioSpaceById(variables, this.auth);
  }
  /**
   * Retrieves available space topics.
   * @returns An array of space topics.
   */
  async browseSpaceTopics() {
    return await fetchBrowseSpaceTopics(this.auth);
  }
  /**
   * Retrieves available communities.
   * @returns An array of communities.
   */
  async communitySelectQuery() {
    return await fetchCommunitySelectQuery(this.auth);
  }
  /**
   * Retrieves the status of an Audio Space stream by its media key.
   * @param mediaKey The media key of the Audio Space.
   * @returns The status of the Audio Space stream.
   */
  async getAudioSpaceStreamStatus(mediaKey) {
    return await fetchLiveVideoStreamStatus(mediaKey, this.auth);
  }
  /**
   * Retrieves the status of an Audio Space by its ID.
   * This method internally fetches the Audio Space to obtain the media key,
   * then retrieves the stream status using the media key.
   * @param audioSpaceId The ID of the Audio Space.
   * @returns The status of the Audio Space stream.
   */
  async getAudioSpaceStatus(audioSpaceId) {
    const audioSpace = await this.getAudioSpaceById(audioSpaceId);
    const mediaKey = audioSpace.metadata.media_key;
    if (!mediaKey) {
      throw new Error("Media Key not found in Audio Space metadata.");
    }
    return await this.getAudioSpaceStreamStatus(mediaKey);
  }
  /**
   * Authenticates Periscope to obtain a token.
   * @returns The Periscope authentication token.
   */
  async authenticatePeriscope() {
    return await fetchAuthenticatePeriscope(this.auth);
  }
  /**
   * Logs in to Twitter via Proxsee using the Periscope JWT.
   * @param jwt The JWT obtained from AuthenticatePeriscope.
   * @returns The response containing the cookie and user information.
   */
  async loginTwitterToken(jwt) {
    return await fetchLoginTwitterToken(jwt, this.auth);
  }
  /**
   * Orchestrates the flow: get token -> login -> return Periscope cookie
   */
  async getPeriscopeCookie() {
    const periscopeToken = await this.authenticatePeriscope();
    const loginResponse = await this.loginTwitterToken(periscopeToken);
    return loginResponse.cookie;
  }
  /**
   * Fetches a article (long form tweet) by its ID.
   * @param id The ID of the article to fetch. In the format of (http://x.com/i/article/id)
   * @returns The {@link TimelineArticle} object, or `null` if it couldn't be fetched.
   */
  getArticle(id) {
    return getArticle(id, this.auth);
  }
  /**
   * Creates a new conversation with Grok.
   * @returns A promise that resolves to the conversation ID string.
   */
  async createGrokConversation() {
    return await createGrokConversation(this.auth);
  }
  /**
   * Interact with Grok in a chat-like manner.
   * @param options The options for the Grok chat interaction.
   * @param {GrokMessage[]} options.messages - Array of messages in the conversation.
   * @param {string} [options.conversationId] - Optional ID of an existing conversation.
   * @param {boolean} [options.returnSearchResults] - Whether to return search results.
   * @param {boolean} [options.returnCitations] - Whether to return citations.
   * @returns A promise that resolves to the Grok chat response.
   */
  async grokChat(options) {
    return await grokChat(options, this.auth);
  }
  /**
   * Retrieves all users who retweeted the given tweet.
   * @param tweetId The ID of the tweet.
   * @returns An array of users (retweeters).
   */
  async getRetweetersOfTweet(tweetId) {
    return await getAllRetweeters(tweetId, this.auth);
  }
  /**
   * Fetches all tweets quoting a given tweet ID by chaining requests
   * until no more pages are available.
   * @param quotedTweetId The tweet ID to find quotes of.
   * @param maxTweetsPerPage Max tweets per page (default 20).
   * @returns An array of all Tweet objects referencing the given tweet.
   */
  async getAllQuotedTweets(quotedTweetId, maxTweetsPerPage = 20) {
    const allQuotes = [];
    let cursor;
    let prevCursor;
    while (true) {
      const page = await fetchQuotedTweetsPage(quotedTweetId, maxTweetsPerPage, this.auth, cursor);
      if (!page.tweets || page.tweets.length === 0) {
        break;
      }
      allQuotes.push(...page.tweets);
      if (!page.next || page.next === cursor || page.next === prevCursor) {
        break;
      }
      prevCursor = cursor;
      cursor = page.next;
    }
    return allQuotes;
  }
};

// src/client/spaces/core/Space.ts
import { EventEmitter as EventEmitter4 } from "node:events";

// src/client/spaces/logger.ts
var Logger = class {
  /**
   * Constructor for initializing a new instance of the class.
   *
   * @param {boolean} debugEnabled - Specifies whether debug mode is enabled or not.
   */
  constructor(debugEnabled) {
    this.debugEnabled = debugEnabled;
  }
  /**
   * Logs an info message with optional additional arguments.
   *
   * @param {string} msg - The info message to log.
   * @param {...any} args - Additional arguments to include in the log message.
   */
  info(msg, ...args) {
    console.log(msg, ...args);
  }
  /**
   * Logs a debug message if debug mode is enabled.
   *
   * @param {string} msg - The debug message to be logged.
   * @param {...any} args - Additional arguments to be passed to the console.log function.
   */
  debug(msg, ...args) {
    if (this.debugEnabled) {
      console.log(msg, ...args);
    }
  }
  /**
   * Logs a warning message to the console.
   *
   * @param {string} msg The warning message to be logged.
   * @param {...any} args Additional arguments to be logged along with the message.
   */
  warn(msg, ...args) {
    console.warn("[WARN]", msg, ...args);
  }
  /**
   * Logs an error message to the console.
   *
   * @param {string} msg - The error message to be logged.
   * @param {...any} args - Additional arguments to be logged along with the error message.
   */
  error(msg, ...args) {
    console.error(msg, ...args);
  }
  /**
   * Check if debug mode is enabled.
   * @returns {boolean} True if debug mode is enabled, false otherwise.
   */
  isDebugEnabled() {
    return this.debugEnabled;
  }
};

// src/client/spaces/utils.ts
import { Headers as Headers6 } from "headers-polyfill";
async function authorizeToken(cookie) {
  const headers = new Headers6({
    "X-Periscope-User-Agent": "Twitter/m5",
    "Content-Type": "application/json",
    "X-Idempotence": Date.now().toString(),
    Referer: "https://x.com/",
    "X-Attempt": "1"
  });
  const resp = await fetch("https://proxsee.pscp.tv/api/v2/authorizeToken", {
    method: "POST",
    headers,
    body: JSON.stringify({
      service: "guest",
      cookie
    })
  });
  if (!resp.ok) {
    throw new Error(`authorizeToken => request failed with status ${resp.status}`);
  }
  const data = await resp.json();
  if (!data.authorization_token) {
    throw new Error("authorizeToken => Missing authorization_token in response");
  }
  return data.authorization_token;
}
async function publishBroadcast(params) {
  const headers = new Headers6({
    "X-Periscope-User-Agent": "Twitter/m5",
    "Content-Type": "application/json",
    Referer: "https://x.com/",
    "X-Idempotence": Date.now().toString(),
    "X-Attempt": "1"
  });
  await fetch("https://proxsee.pscp.tv/api/v2/publishBroadcast", {
    method: "POST",
    headers,
    body: JSON.stringify({
      accept_guests: true,
      broadcast_id: params.broadcast.room_id,
      webrtc_handle_id: params.janusHandleId,
      webrtc_session_id: params.janusSessionId,
      janus_publisher_id: params.janusPublisherId,
      janus_room_id: params.broadcast.room_id,
      cookie: params.cookie,
      status: params.title,
      conversation_controls: 0
    })
  });
}
async function getTurnServers(cookie) {
  const headers = new Headers6({
    "X-Periscope-User-Agent": "Twitter/m5",
    "Content-Type": "application/json",
    Referer: "https://x.com/",
    "X-Idempotence": Date.now().toString(),
    "X-Attempt": "1"
  });
  const resp = await fetch("https://proxsee.pscp.tv/api/v2/turnServers", {
    method: "POST",
    headers,
    body: JSON.stringify({ cookie })
  });
  if (!resp.ok) {
    throw new Error(`getTurnServers => request failed with status ${resp.status}`);
  }
  return resp.json();
}
async function getRegion() {
  const resp = await fetch("https://signer.pscp.tv/region", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://x.com"
    },
    body: JSON.stringify({})
  });
  if (!resp.ok) {
    throw new Error(`getRegion => request failed with status ${resp.status}`);
  }
  const data = await resp.json();
  return data.region;
}
async function createBroadcast(params) {
  const headers = new Headers6({
    "X-Periscope-User-Agent": "Twitter/m5",
    "Content-Type": "application/json",
    "X-Idempotence": Date.now().toString(),
    Referer: "https://x.com/",
    "X-Attempt": "1"
  });
  const resp = await fetch("https://proxsee.pscp.tv/api/v2/createBroadcast", {
    method: "POST",
    headers,
    body: JSON.stringify({
      app_component: "audio-room",
      content_type: "visual_audio",
      cookie: params.cookie,
      conversation_controls: 0,
      description: params.description || "",
      height: 1080,
      is_360: false,
      is_space_available_for_replay: params.record,
      is_webrtc: true,
      languages: params.languages ?? [],
      region: params.region,
      width: 1920
    })
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`createBroadcast => request failed with status ${resp.status} ${text}`);
  }
  const data = await resp.json();
  return data;
}
async function accessChat(chatToken, cookie) {
  const url = "https://proxsee.pscp.tv/api/v2/accessChat";
  const headers = new Headers6({
    "Content-Type": "application/json",
    "X-Periscope-User-Agent": "Twitter/m5"
  });
  const body = {
    chat_token: chatToken,
    cookie
  };
  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    throw new Error(`accessChat => request failed with status ${resp.status}`);
  }
  return resp.json();
}
async function startWatching(lifecycleToken, cookie) {
  const url = "https://proxsee.pscp.tv/api/v2/startWatching";
  const headers = new Headers6({
    "Content-Type": "application/json",
    "X-Periscope-User-Agent": "Twitter/m5"
  });
  const body = {
    auto_play: false,
    life_cycle_token: lifecycleToken,
    cookie
  };
  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    throw new Error(`startWatching => request failed with status ${resp.status}`);
  }
  const json = await resp.json();
  return json.session;
}
async function stopWatching(session, cookie) {
  const url = "https://proxsee.pscp.tv/api/v2/stopWatching";
  const headers = new Headers6({
    "Content-Type": "application/json",
    "X-Periscope-User-Agent": "Twitter/m5"
  });
  const body = { session, cookie };
  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    throw new Error(`stopWatching => request failed with status ${resp.status}`);
  }
}
async function submitSpeakerRequest(params) {
  const url = "https://guest.pscp.tv/api/v1/audiospace/request/submit";
  const headers = new Headers6({
    "Content-Type": "application/json",
    Authorization: params.authToken
  });
  const body = {
    ntpForBroadcasterFrame: "2208988800030000000",
    ntpForLiveFrame: "2208988800030000000",
    broadcast_id: params.broadcastId,
    chat_token: params.chatToken
  };
  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    throw new Error(`submitSpeakerRequest => request failed with status ${resp.status}`);
  }
  return resp.json();
}
async function cancelSpeakerRequest(params) {
  const url = "https://guest.pscp.tv/api/v1/audiospace/request/cancel";
  const headers = new Headers6({
    "Content-Type": "application/json",
    Authorization: params.authToken
  });
  const body = {
    ntpForBroadcasterFrame: "2208988800002000000",
    ntpForLiveFrame: "2208988800002000000",
    broadcast_id: params.broadcastId,
    session_uuid: params.sessionUUID,
    chat_token: params.chatToken
  };
  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    throw new Error(`cancelSpeakerRequest => request failed with status ${resp.status}`);
  }
  return resp.json();
}
async function negotiateGuestStream(params) {
  const url = "https://guest.pscp.tv/api/v1/audiospace/stream/negotiate";
  const headers = new Headers6({
    "Content-Type": "application/json",
    Authorization: params.authToken
  });
  const body = {
    session_uuid: params.sessionUUID
  };
  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    throw new Error(`negotiateGuestStream => request failed with status ${resp.status}`);
  }
  return resp.json();
}
async function muteSpeaker(params) {
  const url = "https://guest.pscp.tv/api/v1/audiospace/muteSpeaker";
  const body = {
    ntpForBroadcasterFrame: 2208988800031e6,
    ntpForLiveFrame: 2208988800031e6,
    session_uuid: params.sessionUUID ?? "",
    broadcast_id: params.broadcastId,
    chat_token: params.chatToken
  };
  const headers = new Headers6({
    "Content-Type": "application/json",
    Authorization: params.authToken
  });
  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`muteSpeaker => ${resp.status} ${text}`);
  }
}
async function unmuteSpeaker(params) {
  const url = "https://guest.pscp.tv/api/v1/audiospace/unmuteSpeaker";
  const body = {
    ntpForBroadcasterFrame: 2208988800031e6,
    ntpForLiveFrame: 2208988800031e6,
    session_uuid: params.sessionUUID ?? "",
    broadcast_id: params.broadcastId,
    chat_token: params.chatToken
  };
  const headers = new Headers6({
    "Content-Type": "application/json",
    Authorization: params.authToken
  });
  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`unmuteSpeaker => ${resp.status} ${text}`);
  }
}
function setupCommonChatEvents(chatClient, logger11, emitter) {
  chatClient.on("occupancyUpdate", (upd) => {
    logger11.debug("[ChatEvents] occupancyUpdate =>", upd);
    emitter.emit("occupancyUpdate", upd);
  });
  chatClient.on("guestReaction", (reaction) => {
    logger11.debug("[ChatEvents] guestReaction =>", reaction);
    emitter.emit("guestReaction", reaction);
  });
  chatClient.on("muteStateChanged", (evt) => {
    logger11.debug("[ChatEvents] muteStateChanged =>", evt);
    emitter.emit("muteStateChanged", evt);
  });
  chatClient.on("speakerRequest", (req) => {
    logger11.debug("[ChatEvents] speakerRequest =>", req);
    emitter.emit("speakerRequest", req);
  });
  chatClient.on("newSpeakerAccepted", (info) => {
    logger11.debug("[ChatEvents] newSpeakerAccepted =>", info);
    emitter.emit("newSpeakerAccepted", info);
  });
  chatClient.on("newSpeakerRemoved", (info) => {
    logger11.debug("[ChatEvents] newSpeakerRemoved =>", info);
    emitter.emit("newSpeakerRemoved", info);
  });
}

// src/client/spaces/core/ChatClient.ts
import { EventEmitter } from "node:events";
import WebSocket from "ws";
var ChatClient = class extends EventEmitter {
  constructor(config) {
    super();
    this.connected = false;
    this.spaceId = config.spaceId;
    this.accessToken = config.accessToken;
    this.endpoint = config.endpoint;
    this.logger = config.logger;
  }
  /**
   * Establishes a WebSocket connection to the chat endpoint and sets up event handlers.
   */
  async connect() {
    const wsUrl = `${this.endpoint}/chatapi/v1/chatnow`.replace("https://", "wss://");
    this.logger.info("[ChatClient] Connecting =>", wsUrl);
    this.ws = new WebSocket(wsUrl, {
      headers: {
        Origin: "https://x.com",
        "User-Agent": "Mozilla/5.0"
      }
    });
    await this.setupHandlers();
  }
  /**
   * Internal method to set up WebSocket event listeners (open, message, close, error).
   */
  setupHandlers() {
    if (!this.ws) {
      throw new Error("[ChatClient] No WebSocket instance available");
    }
    return new Promise((resolve, reject) => {
      this.ws?.on("open", () => {
        this.logger.info("[ChatClient] Connected");
        this.connected = true;
        this.sendAuthAndJoin();
        resolve();
      });
      this.ws?.on("message", (data) => {
        this.handleMessage(data.toString());
      });
      this.ws?.on("close", () => {
        this.logger.info("[ChatClient] Closed");
        this.connected = false;
        this.emit("disconnected");
      });
      this.ws?.on("error", (err) => {
        this.logger.error("[ChatClient] Error =>", err);
        reject(err);
      });
    });
  }
  /**
   * Sends two WebSocket messages to authenticate and join the specified space.
   */
  sendAuthAndJoin() {
    if (!this.ws) return;
    this.ws.send(
      JSON.stringify({
        payload: JSON.stringify({ access_token: this.accessToken }),
        kind: 3
      })
    );
    this.ws.send(
      JSON.stringify({
        payload: JSON.stringify({
          body: JSON.stringify({ room: this.spaceId }),
          kind: 1
        }),
        kind: 2
      })
    );
  }
  /**
   * Sends an emoji reaction to the chat server.
   * @param emoji - The emoji string, e.g. '🔥', '🙏', etc.
   */
  reactWithEmoji(emoji) {
    if (!this.ws || !this.connected) {
      this.logger.warn("[ChatClient] Not connected or WebSocket missing; ignoring reactWithEmoji.");
      return;
    }
    const payload = JSON.stringify({
      body: JSON.stringify({ body: emoji, type: 2, v: 2 }),
      kind: 1,
      /*
      // The 'sender' field is not required, it's not even verified by the server
      // Instead of passing attributes down here it's easier to ignore it
      sender: {
        user_id: null,
        twitter_id: null,
        username: null,
        display_name: null,
      },
      */
      payload: JSON.stringify({
        room: this.spaceId,
        body: JSON.stringify({ body: emoji, type: 2, v: 2 })
      }),
      type: 2
    });
    this.ws.send(payload);
  }
  /**
   * Handles inbound WebSocket messages, parsing JSON payloads
   * and emitting relevant events (speakerRequest, occupancyUpdate, etc.).
   */
  handleMessage(raw) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (!msg.payload) return;
    const payload = safeJson(msg.payload);
    if (!payload?.body) return;
    const body = safeJson(payload.body);
    if (body.guestBroadcastingEvent === 1) {
      const req = {
        userId: body.guestRemoteID,
        username: body.guestUsername,
        displayName: payload.sender?.display_name || body.guestUsername,
        sessionUUID: body.sessionUUID
      };
      this.emit("speakerRequest", req);
    }
    if (typeof body.occupancy === "number") {
      const update = {
        occupancy: body.occupancy,
        totalParticipants: body.total_participants || 0
      };
      this.emit("occupancyUpdate", update);
    }
    if (body.guestBroadcastingEvent === 16) {
      this.emit("muteStateChanged", {
        userId: body.guestRemoteID,
        muted: true
      });
    }
    if (body.guestBroadcastingEvent === 17) {
      this.emit("muteStateChanged", {
        userId: body.guestRemoteID,
        muted: false
      });
    }
    if (body.guestBroadcastingEvent === 12) {
      this.emit("newSpeakerAccepted", {
        userId: body.guestRemoteID,
        username: body.guestUsername,
        sessionUUID: body.sessionUUID
      });
    }
    if (body.guestBroadcastingEvent === 10) {
      this.emit("newSpeakerRemoved", {
        userId: body.guestRemoteID,
        username: body.guestUsername,
        sessionUUID: body.sessionUUID
      });
    }
    if (body?.type === 2) {
      this.logger.debug("[ChatClient] Emitting guestReaction =>", body);
      this.emit("guestReaction", {
        displayName: body.displayName,
        emoji: body.body
      });
    }
  }
  /**
   * Closes the WebSocket connection if open, and resets internal state.
   */
  async disconnect() {
    if (this.ws) {
      this.logger.info("[ChatClient] Disconnecting...");
      this.ws.close();
      this.ws = void 0;
      this.connected = false;
    }
  }
};
function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// src/client/spaces/core/JanusClient.ts
import { EventEmitter as EventEmitter3 } from "node:events";
import wrtc2 from "@roamhq/wrtc";

// src/client/spaces/core/JanusAudio.ts
import { EventEmitter as EventEmitter2 } from "node:events";
import wrtc from "@roamhq/wrtc";
var { nonstandard } = wrtc;
var { RTCAudioSource, RTCAudioSink } = nonstandard;
var JanusAudioSource = class extends EventEmitter2 {
  constructor(options) {
    super();
    this.logger = options?.logger;
    this.source = new RTCAudioSource();
    this.track = this.source.createTrack();
  }
  /**
   * Returns the MediaStreamTrack associated with this audio source.
   */
  getTrack() {
    return this.track;
  }
  /**
   * Pushes PCM data into the RTCAudioSource. Typically 16-bit, single- or multi-channel frames.
   * @param samples - The Int16Array audio samples.
   * @param sampleRate - The sampling rate (e.g., 48000).
   * @param channels - Number of channels (e.g., 1 for mono).
   */
  pushPcmData(samples, sampleRate, channels = 1) {
    if (this.logger?.isDebugEnabled()) {
      this.logger?.debug(
        `[JanusAudioSource] pushPcmData => sampleRate=${sampleRate}, channels=${channels}, frames=${samples.length}`
      );
    }
    this.source.onData({
      samples,
      sampleRate,
      bitsPerSample: 16,
      channelCount: channels,
      numberOfFrames: samples.length / channels
    });
  }
};
var JanusAudioSink = class extends EventEmitter2 {
  constructor(track, options) {
    super();
    this.active = true;
    this.logger = options?.logger;
    if (track.kind !== "audio") {
      throw new Error("[JanusAudioSink] Provided track is not an audio track");
    }
    this.sink = new RTCAudioSink(track);
    this.sink.ondata = (frame) => {
      if (!this.active) return;
      if (this.logger?.isDebugEnabled()) {
        this.logger?.debug(
          `[JanusAudioSink] ondata => sampleRate=${frame.sampleRate}, bitsPerSample=${frame.bitsPerSample}, channelCount=${frame.channelCount}, frames=${frame.samples.length}`
        );
      }
      this.emit("audioData", frame);
    };
  }
  /**
   * Stops receiving audio data. Once called, no further 'audioData' events will be emitted.
   */
  stop() {
    this.active = false;
    if (this.logger?.isDebugEnabled()) {
      this.logger?.debug("[JanusAudioSink] stop called => stopping the sink");
    }
    this.sink?.stop();
  }
};

// src/client/spaces/core/JanusClient.ts
var { RTCPeerConnection, MediaStream } = wrtc2;
var JanusClient = class extends EventEmitter3 {
  constructor(config) {
    super();
    this.config = config;
    this.pollActive = false;
    // Tracks promises waiting for specific Janus events
    this.eventWaiters = [];
    // Tracks subscriber handle+pc for each userId we subscribe to
    this.subscribers = /* @__PURE__ */ new Map();
    this.logger = config.logger;
  }
  /**
   * Initializes this JanusClient for the host scenario:
   *  1) createSession()
   *  2) attachPlugin()
   *  3) createRoom()
   *  4) joinRoom()
   *  5) configure local PeerConnection (send audio, etc.)
   */
  async initialize() {
    this.logger.debug("[JanusClient] initialize() called");
    this.sessionId = await this.createSession();
    this.handleId = await this.attachPlugin();
    this.pollActive = true;
    this.startPolling();
    await this.createRoom();
    this.publisherId = await this.joinRoom();
    this.pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: this.config.turnServers.uris,
          username: this.config.turnServers.username,
          credential: this.config.turnServers.password
        }
      ]
    });
    this.setupPeerEvents();
    this.enableLocalAudio();
    await this.configurePublisher();
    this.logger.info("[JanusClient] Initialization complete");
  }
  /**
   * Initializes this JanusClient for a guest speaker scenario:
   *  1) createSession()
   *  2) attachPlugin()
   *  3) join existing room as publisher (no createRoom call)
   *  4) configure local PeerConnection
   *  5) subscribe to any existing publishers
   */
  async initializeGuestSpeaker(sessionUUID) {
    this.logger.debug("[JanusClient] initializeGuestSpeaker() called");
    this.sessionId = await this.createSession();
    this.handleId = await this.attachPlugin();
    this.pollActive = true;
    this.startPolling();
    const evtPromise = this.waitForJanusEvent(
      (e) => e.janus === "event" && e.plugindata?.plugin === "janus.plugin.videoroom" && e.plugindata?.data?.videoroom === "joined",
      1e4,
      "Guest Speaker joined event"
    );
    const body = {
      request: "join",
      room: this.config.roomId,
      ptype: "publisher",
      display: this.config.userId,
      periscope_user_id: this.config.userId
    };
    await this.sendJanusMessage(this.handleId, body);
    const evt = await evtPromise;
    const data = evt.plugindata?.data;
    this.publisherId = data.id;
    this.logger.debug("[JanusClient] guest joined => publisherId=", this.publisherId);
    const publishers = data.publishers || [];
    this.logger.debug("[JanusClient] existing publishers =>", publishers);
    this.pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: this.config.turnServers.uris,
          username: this.config.turnServers.username,
          credential: this.config.turnServers.password
        }
      ]
    });
    this.setupPeerEvents();
    this.enableLocalAudio();
    await this.configurePublisher(sessionUUID);
    await Promise.all(publishers.map((pub) => this.subscribeSpeaker(pub.display, pub.id)));
    this.logger.info("[JanusClient] Guest speaker negotiation complete");
  }
  /**
   * Subscribes to a speaker's audio feed by userId and/or feedId.
   * If feedId=0, we wait for a "publishers" event to discover feedId.
   */
  async subscribeSpeaker(userId, feedId = 0) {
    this.logger.debug("[JanusClient] subscribeSpeaker => userId=", userId);
    const subscriberHandleId = await this.attachPlugin();
    this.logger.debug("[JanusClient] subscriber handle =>", subscriberHandleId);
    if (feedId === 0) {
      const publishersEvt = await this.waitForJanusEvent(
        (e) => e.janus === "event" && e.plugindata?.plugin === "janus.plugin.videoroom" && e.plugindata?.data?.videoroom === "event" && Array.isArray(e.plugindata?.data?.publishers) && e.plugindata?.data?.publishers.length > 0,
        8e3,
        'discover feed_id from "publishers"'
      );
      const list = publishersEvt.plugindata.data.publishers;
      const pub = list.find((p) => p.display === userId || p.periscope_user_id === userId);
      if (!pub) {
        throw new Error(
          `[JanusClient] subscribeSpeaker => No publisher found for userId=${userId}`
        );
      }
      feedId = pub.id;
      this.logger.debug("[JanusClient] found feedId =>", feedId);
    }
    this.emit("subscribedSpeaker", { userId, feedId });
    const joinBody = {
      request: "join",
      room: this.config.roomId,
      periscope_user_id: this.config.userId,
      ptype: "subscriber",
      streams: [
        {
          feed: feedId,
          mid: "0",
          send: true
          // indicates we might send audio?
        }
      ]
    };
    await this.sendJanusMessage(subscriberHandleId, joinBody);
    const attachedEvt = await this.waitForJanusEvent(
      (e) => e.janus === "event" && e.sender === subscriberHandleId && e.plugindata?.plugin === "janus.plugin.videoroom" && e.plugindata?.data?.videoroom === "attached" && e.jsep?.type === "offer",
      8e3,
      "subscriber attached + offer"
    );
    this.logger.debug('[JanusClient] subscriber => "attached" with offer');
    const offer = attachedEvt.jsep;
    const subPc = new RTCPeerConnection({
      iceServers: [
        {
          urls: this.config.turnServers.uris,
          username: this.config.turnServers.username,
          credential: this.config.turnServers.password
        }
      ]
    });
    subPc.ontrack = (evt) => {
      this.logger.debug(
        "[JanusClient] subscriber track => kind=%s, readyState=%s, muted=%s",
        evt.track.kind,
        evt.track.readyState,
        evt.track.muted
      );
      const sink = new JanusAudioSink(evt.track, { logger: this.logger });
      sink.on("audioData", (frame) => {
        if (this.logger.isDebugEnabled()) {
          let maxVal = 0;
          for (let i = 0; i < frame.samples.length; i++) {
            const val = Math.abs(frame.samples[i]);
            if (val > maxVal) maxVal = val;
          }
          this.logger.debug(`[AudioSink] userId=${userId}, maxAmplitude=${maxVal}`);
        }
        this.emit("audioDataFromSpeaker", {
          userId,
          bitsPerSample: frame.bitsPerSample,
          sampleRate: frame.sampleRate,
          numberOfFrames: frame.numberOfFrames,
          channelCount: frame.channelCount,
          samples: frame.samples
        });
      });
    };
    await subPc.setRemoteDescription(offer);
    const answer = await subPc.createAnswer();
    await subPc.setLocalDescription(answer);
    await this.sendJanusMessage(
      subscriberHandleId,
      {
        request: "start",
        room: this.config.roomId,
        periscope_user_id: this.config.userId
      },
      answer
    );
    this.logger.debug("[JanusClient] subscriber => done (user=", userId, ")");
    this.subscribers.set(userId, { handleId: subscriberHandleId, pc: subPc });
  }
  /**
   * Pushes local PCM frames to Janus. If the localAudioSource isn't active, it enables it.
   */
  pushLocalAudio(samples, sampleRate, channels = 1) {
    if (!this.localAudioSource) {
      this.logger.warn("[JanusClient] No localAudioSource => enabling now...");
      this.enableLocalAudio();
    }
    this.localAudioSource?.pushPcmData(samples, sampleRate, channels);
  }
  /**
   * Ensures a local audio track is added to the RTCPeerConnection for publishing.
   */
  enableLocalAudio() {
    if (!this.pc) {
      this.logger.warn("[JanusClient] enableLocalAudio => No RTCPeerConnection");
      return;
    }
    if (this.localAudioSource) {
      this.logger.debug("[JanusClient] localAudioSource already active");
      return;
    }
    this.localAudioSource = new JanusAudioSource({ logger: this.logger });
    const track = this.localAudioSource.getTrack();
    const localStream = new MediaStream();
    localStream.addTrack(track);
    this.pc.addTrack(track, localStream);
  }
  /**
   * Stops the Janus client: ends polling, closes the RTCPeerConnection, etc.
   * Does not destroy or leave the room automatically; call destroyRoom() or leaveRoom() if needed.
   */
  async stop() {
    this.logger.info("[JanusClient] Stopping...");
    this.pollActive = false;
    if (this.pc) {
      this.pc.close();
      this.pc = void 0;
    }
  }
  /**
   * Returns the current Janus sessionId, if any.
   */
  getSessionId() {
    return this.sessionId;
  }
  /**
   * Returns the Janus handleId for the publisher, if any.
   */
  getHandleId() {
    return this.handleId;
  }
  /**
   * Returns the Janus publisherId (internal participant ID), if any.
   */
  getPublisherId() {
    return this.publisherId;
  }
  /**
   * Creates a new Janus session via POST /janus (with "janus":"create").
   */
  async createSession() {
    const transaction = this.randomTid();
    const resp = await fetch(this.config.webrtcUrl, {
      method: "POST",
      headers: {
        Authorization: this.config.credential,
        "Content-Type": "application/json",
        Referer: "https://x.com"
      },
      body: JSON.stringify({
        janus: "create",
        transaction
      })
    });
    if (!resp.ok) {
      throw new Error("[JanusClient] createSession failed");
    }
    const json = await resp.json();
    if (json.janus !== "success") {
      throw new Error("[JanusClient] createSession invalid response");
    }
    return json.data.id;
  }
  /**
   * Attaches to the videoroom plugin via /janus/{sessionId} (with "janus":"attach").
   */
  async attachPlugin() {
    if (!this.sessionId) {
      throw new Error("[JanusClient] attachPlugin => no sessionId");
    }
    const transaction = this.randomTid();
    const resp = await fetch(`${this.config.webrtcUrl}/${this.sessionId}`, {
      method: "POST",
      headers: {
        Authorization: this.config.credential,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        janus: "attach",
        plugin: "janus.plugin.videoroom",
        transaction
      })
    });
    if (!resp.ok) {
      throw new Error("[JanusClient] attachPlugin failed");
    }
    const json = await resp.json();
    if (json.janus !== "success") {
      throw new Error("[JanusClient] attachPlugin invalid response");
    }
    return json.data.id;
  }
  /**
   * Creates a Janus room for the host scenario.
   * For a guest, this step is skipped (the room already exists).
   */
  async createRoom() {
    if (!this.sessionId || !this.handleId) {
      throw new Error("[JanusClient] createRoom => No session/handle");
    }
    const transaction = this.randomTid();
    const body = {
      request: "create",
      room: this.config.roomId,
      periscope_user_id: this.config.userId,
      audiocodec: "opus",
      videocodec: "h264",
      transport_wide_cc_ext: true,
      app_component: "audio-room",
      h264_profile: "42e01f",
      dummy_publisher: false
    };
    const resp = await fetch(`${this.config.webrtcUrl}/${this.sessionId}/${this.handleId}`, {
      method: "POST",
      headers: {
        Authorization: this.config.credential,
        "Content-Type": "application/json",
        Referer: "https://x.com"
      },
      body: JSON.stringify({
        janus: "message",
        transaction,
        body
      })
    });
    if (!resp.ok) {
      throw new Error(`[JanusClient] createRoom failed => ${resp.status}`);
    }
    const json = await resp.json();
    this.logger.debug("[JanusClient] createRoom =>", JSON.stringify(json));
    if (json.janus === "error") {
      throw new Error(`[JanusClient] createRoom error => ${json.error?.reason || "Unknown"}`);
    }
    if (json.plugindata?.data?.videoroom !== "created") {
      throw new Error(`[JanusClient] unexpected createRoom response => ${JSON.stringify(json)}`);
    }
    this.logger.debug(`[JanusClient] Room '${this.config.roomId}' created successfully`);
  }
  /**
   * Joins the created room as a publisher, for the host scenario.
   */
  async joinRoom() {
    if (!this.sessionId || !this.handleId) {
      throw new Error("[JanusClient] no session/handle for joinRoom()");
    }
    this.logger.debug("[JanusClient] joinRoom => start");
    const evtPromise = this.waitForJanusEvent(
      (e) => e.janus === "event" && e.plugindata?.plugin === "janus.plugin.videoroom" && e.plugindata?.data?.videoroom === "joined",
      12e3,
      "Host Joined Event"
    );
    const body = {
      request: "join",
      room: this.config.roomId,
      ptype: "publisher",
      display: this.config.userId,
      periscope_user_id: this.config.userId
    };
    await this.sendJanusMessage(this.handleId, body);
    const evt = await evtPromise;
    const publisherId = evt.plugindata.data.id;
    this.logger.debug("[JanusClient] joined room => publisherId=", publisherId);
    return publisherId;
  }
  /**
   * Creates an SDP offer and sends "configure" to Janus with it.
   * Used by both host and guest after attach + join.
   */
  async configurePublisher(sessionUUID = "") {
    if (!this.pc || !this.sessionId || !this.handleId) {
      return;
    }
    this.logger.debug("[JanusClient] createOffer...");
    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false
    });
    await this.pc.setLocalDescription(offer);
    this.logger.debug("[JanusClient] sending configure with JSEP...");
    await this.sendJanusMessage(
      this.handleId,
      {
        request: "configure",
        room: this.config.roomId,
        periscope_user_id: this.config.userId,
        session_uuid: sessionUUID,
        stream_name: this.config.streamName,
        vidman_token: this.config.credential
      },
      offer
    );
    this.logger.debug("[JanusClient] waiting for answer...");
  }
  /**
   * Sends a "janus":"message" to the Janus handle, optionally with jsep.
   */
  async sendJanusMessage(handleId, body, jsep) {
    if (!this.sessionId) {
      throw new Error("[JanusClient] No session for sendJanusMessage");
    }
    const transaction = this.randomTid();
    const resp = await fetch(`${this.config.webrtcUrl}/${this.sessionId}/${handleId}`, {
      method: "POST",
      headers: {
        Authorization: this.config.credential,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        janus: "message",
        transaction,
        body,
        jsep
      })
    });
    if (!resp.ok) {
      throw new Error(`[JanusClient] sendJanusMessage failed => status=${resp.status}`);
    }
  }
  /**
   * Starts polling /janus/{sessionId}?maxev=1 for events. We parse keepalives, answers, etc.
   */
  startPolling() {
    this.logger.debug("[JanusClient] Starting polling...");
    const doPoll = async () => {
      if (!this.pollActive || !this.sessionId) {
        this.logger.debug("[JanusClient] Polling stopped");
        return;
      }
      try {
        const url = `${this.config.webrtcUrl}/${this.sessionId}?maxev=1&_=${Date.now()}`;
        const resp = await fetch(url, {
          headers: { Authorization: this.config.credential }
        });
        if (resp.ok) {
          const event = await resp.json();
          this.handleJanusEvent(event);
        } else {
          this.logger.warn("[JanusClient] poll error =>", resp.status);
        }
      } catch (err) {
        this.logger.error("[JanusClient] poll exception =>", err);
      }
      setTimeout(doPoll, 500);
    };
    doPoll();
  }
  /**
   * Processes each Janus event received from the poll cycle.
   */
  handleJanusEvent(evt) {
    if (!evt.janus) {
      return;
    }
    if (evt.janus === "keepalive") {
      this.logger.debug("[JanusClient] keepalive received");
      return;
    }
    if (evt.janus === "webrtcup") {
      this.logger.debug("[JanusClient] webrtcup => sender=", evt.sender);
    }
    if (evt.jsep && evt.jsep.type === "answer") {
      this.onReceivedAnswer(evt.jsep);
    }
    if (evt.plugindata?.data?.id) {
      this.publisherId = evt.plugindata.data.id;
    }
    if (evt.error) {
      this.logger.error("[JanusClient] Janus error =>", evt.error.reason);
      this.emit("error", new Error(evt.error.reason));
    }
    for (let i = 0; i < this.eventWaiters.length; i++) {
      const waiter = this.eventWaiters[i];
      if (waiter.predicate(evt)) {
        this.eventWaiters.splice(i, 1);
        waiter.resolve(evt);
        break;
      }
    }
  }
  /**
   * Called whenever we get an SDP "answer" from Janus. Sets the remote description on our PC.
   */
  async onReceivedAnswer(answer) {
    if (!this.pc) {
      return;
    }
    this.logger.debug("[JanusClient] got answer => setRemoteDescription");
    await this.pc.setRemoteDescription(answer);
  }
  /**
   * Sets up events on our main RTCPeerConnection for ICE changes, track additions, etc.
   */
  setupPeerEvents() {
    if (!this.pc) {
      return;
    }
    this.pc.addEventListener("iceconnectionstatechange", () => {
      this.logger.debug("[JanusClient] ICE state =>", this.pc?.iceConnectionState);
      if (this.pc?.iceConnectionState === "failed") {
        this.emit("error", new Error("[JanusClient] ICE connection failed"));
      }
    });
    this.pc.addEventListener("track", (evt) => {
      this.logger.debug("[JanusClient] ontrack => kind=", evt.track.kind);
    });
  }
  /**
   * Generates a random transaction ID for Janus requests.
   */
  randomTid() {
    return Math.random().toString(36).slice(2, 10);
  }
  /**
   * Waits for a specific Janus event (e.g., "joined", "attached", etc.)
   * that matches a given predicate. Times out after timeoutMs if not received.
   */
  async waitForJanusEvent(predicate, timeoutMs = 5e3, description = "some event") {
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve, reject };
      this.eventWaiters.push(waiter);
      setTimeout(() => {
        const idx = this.eventWaiters.indexOf(waiter);
        if (idx !== -1) {
          this.eventWaiters.splice(idx, 1);
          this.logger.warn(
            `[JanusClient] waitForJanusEvent => timed out waiting for: ${description}`
          );
          reject(
            new Error(
              `[JanusClient] waitForJanusEvent (expecting "${description}") timed out after ${timeoutMs}ms`
            )
          );
        }
      }, timeoutMs);
    });
  }
  /**
   * Destroys the Janus room (host only). Does not close local PC or stop polling.
   */
  async destroyRoom() {
    if (!this.sessionId || !this.handleId) {
      this.logger.warn("[JanusClient] destroyRoom => no session/handle");
      return;
    }
    if (!this.config.roomId || !this.config.userId) {
      this.logger.warn("[JanusClient] destroyRoom => no roomId/userId");
      return;
    }
    const transaction = this.randomTid();
    const body = {
      request: "destroy",
      room: this.config.roomId,
      periscope_user_id: this.config.userId
    };
    this.logger.info("[JanusClient] destroying room =>", body);
    const resp = await fetch(`${this.config.webrtcUrl}/${this.sessionId}/${this.handleId}`, {
      method: "POST",
      headers: {
        Authorization: this.config.credential,
        "Content-Type": "application/json",
        Referer: "https://x.com"
      },
      body: JSON.stringify({
        janus: "message",
        transaction,
        body
      })
    });
    if (!resp.ok) {
      throw new Error(`[JanusClient] destroyRoom failed => ${resp.status}`);
    }
    const json = await resp.json();
    this.logger.debug("[JanusClient] destroyRoom =>", JSON.stringify(json));
  }
  /**
   * Leaves the Janus room if we've joined. Does not close the local PC or stop polling.
   */
  async leaveRoom() {
    if (!this.sessionId || !this.handleId) {
      this.logger.warn("[JanusClient] leaveRoom => no session/handle");
      return;
    }
    const transaction = this.randomTid();
    const body = {
      request: "leave",
      room: this.config.roomId,
      periscope_user_id: this.config.userId
    };
    this.logger.info("[JanusClient] leaving room =>", body);
    const resp = await fetch(`${this.config.webrtcUrl}/${this.sessionId}/${this.handleId}`, {
      method: "POST",
      headers: {
        Authorization: this.config.credential,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        janus: "message",
        transaction,
        body
      })
    });
    if (!resp.ok) {
      throw new Error(`[JanusClient] leaveRoom => error code ${resp.status}`);
    }
    const json = await resp.json();
    this.logger.debug("[JanusClient] leaveRoom =>", JSON.stringify(json));
  }
};

// src/client/spaces/core/Space.ts
var Space = class extends EventEmitter4 {
  constructor(client, options) {
    super();
    this.client = client;
    this.isInitialized = false;
    this.plugins = /* @__PURE__ */ new Set();
    this.speakers = /* @__PURE__ */ new Map();
    this.debug = options?.debug ?? false;
    this.logger = new Logger(this.debug);
  }
  /**
   * Registers a plugin and calls its onAttach(...).
   * init(...) will be invoked once initialization is complete.
   */
  use(plugin, config) {
    const registration = { plugin, config };
    this.plugins.add(registration);
    this.logger.debug("[Space] Plugin added =>", plugin.constructor.name);
    plugin.onAttach?.({ space: this, pluginConfig: config });
    if (this.isInitialized && plugin.init) {
      plugin.init({ space: this, pluginConfig: config });
      if (this.janusClient) {
        plugin.onJanusReady?.(this.janusClient);
      }
    }
    return this;
  }
  /**
   * Main entry point to create and initialize the Space broadcast.
   */
  async initialize(config) {
    this.logger.debug("[Space] Initializing...");
    const cookie = await this.client.getPeriscopeCookie();
    const region = await getRegion();
    this.logger.debug("[Space] Got region =>", region);
    this.logger.debug("[Space] Creating broadcast...");
    const broadcast = await createBroadcast({
      description: config.description,
      languages: config.languages,
      cookie,
      region,
      record: config.record
    });
    this.broadcastInfo = broadcast;
    this.logger.debug("[Space] Authorizing token...");
    this.authToken = await authorizeToken(cookie);
    this.logger.debug("[Space] Getting turn servers...");
    const turnServers = await getTurnServers(cookie);
    this.janusClient = new JanusClient({
      webrtcUrl: broadcast.webrtc_gw_url,
      roomId: broadcast.room_id,
      credential: broadcast.credential,
      userId: broadcast.broadcast.user_id,
      streamName: broadcast.stream_name,
      turnServers,
      logger: this.logger
    });
    await this.janusClient.initialize();
    this.janusClient.on("audioDataFromSpeaker", (data) => {
      this.logger.debug("[Space] Received PCM from speaker =>", data.userId);
      this.handleAudioData(data);
    });
    this.janusClient.on("subscribedSpeaker", ({ userId, feedId }) => {
      const speaker = this.speakers.get(userId);
      if (!speaker) {
        this.logger.debug("[Space] subscribedSpeaker => no speaker found", userId);
        return;
      }
      speaker.janusParticipantId = feedId;
      this.logger.debug(`[Space] updated speaker => userId=${userId}, feedId=${feedId}`);
    });
    this.logger.debug("[Space] Publishing broadcast...");
    await publishBroadcast({
      title: config.title || "",
      broadcast,
      cookie,
      janusSessionId: this.janusClient.getSessionId(),
      janusHandleId: this.janusClient.getHandleId(),
      janusPublisherId: this.janusClient.getPublisherId()
    });
    if (config.mode === "INTERACTIVE") {
      this.logger.debug("[Space] Connecting chat...");
      this.chatClient = new ChatClient({
        spaceId: broadcast.room_id,
        accessToken: broadcast.access_token,
        endpoint: broadcast.endpoint,
        logger: this.logger
      });
      await this.chatClient.connect();
      this.setupChatEvents();
    }
    this.logger.info("[Space] Initialized =>", broadcast.share_url.replace("broadcasts", "spaces"));
    this.isInitialized = true;
    for (const { plugin, config: pluginConfig } of this.plugins) {
      plugin.init?.({ space: this, pluginConfig });
      plugin.onJanusReady?.(this.janusClient);
    }
    this.logger.debug("[Space] All plugins initialized");
    return broadcast;
  }
  /**
   * Send an emoji reaction via chat, if interactive.
   */
  reactWithEmoji(emoji) {
    if (!this.chatClient) return;
    this.chatClient.reactWithEmoji(emoji);
  }
  /**
   * Internal method to wire up chat events if interactive.
   */
  setupChatEvents() {
    if (!this.chatClient) return;
    setupCommonChatEvents(this.chatClient, this.logger, this);
  }
  /**
   * Approves a speaker request on Twitter side, then calls Janus to subscribe their audio.
   */
  async approveSpeaker(userId, sessionUUID) {
    if (!this.isInitialized || !this.broadcastInfo) {
      throw new Error("[Space] Not initialized or missing broadcastInfo");
    }
    if (!this.authToken) {
      throw new Error("[Space] No auth token available");
    }
    this.speakers.set(userId, { userId, sessionUUID });
    await this.callApproveEndpoint(this.broadcastInfo, this.authToken, userId, sessionUUID);
    await this.janusClient?.subscribeSpeaker(userId);
  }
  /**
   * Approve request => calls /api/v1/audiospace/request/approve
   */
  async callApproveEndpoint(broadcast, authorizationToken, userId, sessionUUID) {
    const endpoint = "https://guest.pscp.tv/api/v1/audiospace/request/approve";
    const headers = {
      "Content-Type": "application/json",
      Referer: "https://x.com/",
      Authorization: authorizationToken
    };
    const body = {
      ntpForBroadcasterFrame: "2208988800024000300",
      ntpForLiveFrame: "2208988800024000300",
      chat_token: broadcast.access_token,
      session_uuid: sessionUUID
    };
    this.logger.debug("[Space] Approving speaker =>", endpoint, body);
    const resp = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const error = await resp.text();
      throw new Error(`[Space] Failed to approve speaker => ${resp.status}: ${error}`);
    }
    this.logger.info("[Space] Speaker approved =>", userId);
  }
  /**
   * Removes a speaker from the Twitter side, then unsubscribes in Janus if needed.
   */
  async removeSpeaker(userId) {
    if (!this.isInitialized || !this.broadcastInfo) {
      throw new Error("[Space] Not initialized or missing broadcastInfo");
    }
    if (!this.authToken) {
      throw new Error("[Space] No auth token");
    }
    if (!this.janusClient) {
      throw new Error("[Space] No Janus client");
    }
    const speaker = this.speakers.get(userId);
    if (!speaker) {
      throw new Error(`[Space] removeSpeaker => no speaker found for userId=${userId}`);
    }
    const { sessionUUID, janusParticipantId } = speaker;
    this.logger.debug("[Space] removeSpeaker =>", sessionUUID, janusParticipantId, speaker);
    if (!sessionUUID || janusParticipantId === void 0) {
      throw new Error(
        `[Space] removeSpeaker => missing sessionUUID or feedId for userId=${userId}`
      );
    }
    const janusHandleId = this.janusClient.getHandleId();
    const janusSessionId = this.janusClient.getSessionId();
    if (!janusHandleId || !janusSessionId) {
      throw new Error(`[Space] removeSpeaker => missing Janus handle/session for userId=${userId}`);
    }
    await this.callRemoveEndpoint(
      this.broadcastInfo,
      this.authToken,
      sessionUUID,
      janusParticipantId,
      this.broadcastInfo.room_id,
      janusHandleId,
      janusSessionId
    );
    this.speakers.delete(userId);
    this.logger.info(`[Space] removeSpeaker => removed userId=${userId}`);
  }
  /**
   * Twitter's /api/v1/audiospace/stream/eject call
   */
  async callRemoveEndpoint(broadcast, authorizationToken, sessionUUID, janusParticipantId, janusRoomId, webrtcHandleId, webrtcSessionId) {
    const endpoint = "https://guest.pscp.tv/api/v1/audiospace/stream/eject";
    const headers = {
      "Content-Type": "application/json",
      Referer: "https://x.com/",
      Authorization: authorizationToken
    };
    const body = {
      ntpForBroadcasterFrame: "2208988800024000300",
      ntpForLiveFrame: "2208988800024000300",
      session_uuid: sessionUUID,
      chat_token: broadcast.access_token,
      janus_room_id: janusRoomId,
      janus_participant_id: janusParticipantId,
      webrtc_handle_id: webrtcHandleId,
      webrtc_session_id: webrtcSessionId
    };
    this.logger.debug("[Space] Removing speaker =>", endpoint, body);
    const resp = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const error = await resp.text();
      throw new Error(`[Space] Failed to remove speaker => ${resp.status}: ${error}`);
    }
    this.logger.debug("[Space] Speaker removed => sessionUUID=", sessionUUID);
  }
  /**
   * Push PCM audio frames if you're the host. Usually you'd do this if you're capturing
   * microphone input from the host side.
   */
  pushAudio(samples, sampleRate) {
    this.janusClient?.pushLocalAudio(samples, sampleRate);
  }
  /**
   * Handler for PCM from other speakers, forwarded to plugin.onAudioData
   */
  handleAudioData(data) {
    for (const { plugin } of this.plugins) {
      plugin.onAudioData?.(data);
    }
  }
  /**
   * Gracefully shut down this Space: destroy the Janus room, end the broadcast, etc.
   */
  async finalizeSpace() {
    this.logger.info("[Space] finalizeSpace => stopping broadcast gracefully");
    const tasks = [];
    if (this.janusClient) {
      tasks.push(
        this.janusClient.destroyRoom().catch((err) => {
          this.logger.error("[Space] destroyRoom error =>", err);
        })
      );
    }
    if (this.broadcastInfo) {
      tasks.push(
        this.endAudiospace({
          broadcastId: this.broadcastInfo.room_id,
          chatToken: this.broadcastInfo.access_token
        }).catch((err) => {
          this.logger.error("[Space] endAudiospace error =>", err);
        })
      );
    }
    if (this.janusClient) {
      tasks.push(
        this.janusClient.leaveRoom().catch((err) => {
          this.logger.error("[Space] leaveRoom error =>", err);
        })
      );
    }
    await Promise.all(tasks);
    this.logger.info("[Space] finalizeSpace => done.");
  }
  /**
   * Calls /api/v1/audiospace/admin/endAudiospace on Twitter side.
   */
  async endAudiospace(params) {
    const url = "https://guest.pscp.tv/api/v1/audiospace/admin/endAudiospace";
    const headers = {
      "Content-Type": "application/json",
      Referer: "https://x.com/",
      Authorization: this.authToken || ""
    };
    const body = {
      broadcast_id: params.broadcastId,
      chat_token: params.chatToken
    };
    this.logger.debug("[Space] endAudiospace =>", body);
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`[Space] endAudiospace => ${resp.status} ${errText}`);
    }
    const json = await resp.json();
    this.logger.debug("[Space] endAudiospace => success =>", json);
  }
  /**
   * Retrieves an array of known speakers in this Space (by userId and sessionUUID).
   */
  getSpeakers() {
    return Array.from(this.speakers.values());
  }
  /**
   * Mute the host (yourself). For the host, session_uuid = '' (empty).
   */
  async muteHost() {
    if (!this.authToken) {
      throw new Error("[Space] No auth token available");
    }
    if (!this.broadcastInfo) {
      throw new Error("[Space] No broadcastInfo");
    }
    await muteSpeaker({
      broadcastId: this.broadcastInfo.room_id,
      sessionUUID: "",
      // host => empty
      chatToken: this.broadcastInfo.access_token,
      authToken: this.authToken
    });
    this.logger.info("[Space] Host muted successfully.");
  }
  /**
   * Unmute the host (yourself).
   */
  async unmuteHost() {
    if (!this.authToken) {
      throw new Error("[Space] No auth token");
    }
    if (!this.broadcastInfo) {
      throw new Error("[Space] No broadcastInfo");
    }
    await unmuteSpeaker({
      broadcastId: this.broadcastInfo.room_id,
      sessionUUID: "",
      chatToken: this.broadcastInfo.access_token,
      authToken: this.authToken
    });
    this.logger.info("[Space] Host unmuted successfully.");
  }
  /**
   * Mute a specific speaker. We'll retrieve sessionUUID from our local map.
   */
  async muteSpeaker(userId) {
    if (!this.authToken) {
      throw new Error("[Space] No auth token available");
    }
    if (!this.broadcastInfo) {
      throw new Error("[Space] No broadcastInfo");
    }
    const speaker = this.speakers.get(userId);
    if (!speaker) {
      throw new Error(`[Space] Speaker not found for userId=${userId}`);
    }
    await muteSpeaker({
      broadcastId: this.broadcastInfo.room_id,
      sessionUUID: speaker.sessionUUID,
      chatToken: this.broadcastInfo.access_token,
      authToken: this.authToken
    });
    this.logger.info(`[Space] Muted speaker => userId=${userId}`);
  }
  /**
   * Unmute a specific speaker. We'll retrieve sessionUUID from local map.
   */
  async unmuteSpeaker(userId) {
    if (!this.authToken) {
      throw new Error("[Space] No auth token available");
    }
    if (!this.broadcastInfo) {
      throw new Error("[Space] No broadcastInfo");
    }
    const speaker = this.speakers.get(userId);
    if (!speaker) {
      throw new Error(`[Space] Speaker not found for userId=${userId}`);
    }
    await unmuteSpeaker({
      broadcastId: this.broadcastInfo.room_id,
      sessionUUID: speaker.sessionUUID,
      chatToken: this.broadcastInfo.access_token,
      authToken: this.authToken
    });
    this.logger.info(`[Space] Unmuted speaker => userId=${userId}`);
  }
  /**
   * Stop the broadcast entirely, performing finalizeSpace() plus plugin cleanup.
   */
  async stop() {
    this.logger.info("[Space] Stopping...");
    await this.finalizeSpace().catch((err) => {
      this.logger.error("[Space] finalizeBroadcast error =>", err);
    });
    if (this.chatClient) {
      await this.chatClient.disconnect();
      this.chatClient = void 0;
    }
    if (this.janusClient) {
      await this.janusClient.stop();
      this.janusClient = void 0;
    }
    for (const { plugin } of this.plugins) {
      plugin.cleanup?.();
    }
    this.plugins.clear();
    this.isInitialized = false;
  }
};

// src/client/spaces/core/SpaceParticipant.ts
import { EventEmitter as EventEmitter5 } from "node:events";
var SpaceParticipant = class extends EventEmitter5 {
  constructor(client, config) {
    super();
    this.client = client;
    // Plugin management
    this.plugins = /* @__PURE__ */ new Set();
    this.spaceId = config.spaceId;
    this.debug = config.debug ?? false;
    this.logger = new Logger(this.debug);
  }
  /**
   * Adds a plugin and calls its onAttach immediately.
   * init() or onJanusReady() will be invoked later at the appropriate time.
   */
  use(plugin, config) {
    const registration = { plugin, config };
    this.plugins.add(registration);
    this.logger.debug("[SpaceParticipant] Plugin added =>", plugin.constructor.name);
    plugin.onAttach?.({ space: this, pluginConfig: config });
    if (plugin.init) {
      plugin.init({ space: this, pluginConfig: config });
    }
    return this;
  }
  /**
   * Joins the Space as a listener: obtains HLS, chat token, etc.
   */
  async joinAsListener() {
    this.logger.info("[SpaceParticipant] Joining space as listener =>", this.spaceId);
    this.cookie = await this.client.getPeriscopeCookie();
    this.authToken = await authorizeToken(this.cookie);
    const spaceMeta = await this.client.getAudioSpaceById(this.spaceId);
    const mediaKey = spaceMeta?.metadata?.media_key;
    if (!mediaKey) {
      throw new Error("[SpaceParticipant] No mediaKey found in metadata");
    }
    this.logger.debug("[SpaceParticipant] mediaKey =>", mediaKey);
    const status = await this.client.getAudioSpaceStreamStatus(mediaKey);
    this.hlsUrl = status?.source?.location;
    this.chatJwtToken = status?.chatToken;
    this.lifecycleToken = status?.lifecycleToken;
    this.logger.debug("[SpaceParticipant] HLS =>", this.hlsUrl);
    if (!this.chatJwtToken) {
      throw new Error("[SpaceParticipant] No chatToken found");
    }
    const chatInfo = await accessChat(this.chatJwtToken, this.cookie);
    this.chatToken = chatInfo.access_token;
    this.chatClient = new ChatClient({
      spaceId: chatInfo.room_id,
      accessToken: chatInfo.access_token,
      endpoint: chatInfo.endpoint,
      logger: this.logger
    });
    await this.chatClient.connect();
    this.setupChatEvents();
    this.watchSession = await startWatching(this.lifecycleToken, this.cookie);
    this.logger.info("[SpaceParticipant] Joined as listener.");
  }
  /**
   * Returns the HLS URL if you want to consume the stream as a listener.
   */
  getHlsUrl() {
    return this.hlsUrl;
  }
  /**
   * Submits a speaker request using /audiospace/request/submit.
   * Returns the sessionUUID used to track approval.
   */
  async requestSpeaker() {
    if (!this.chatJwtToken) {
      throw new Error("[SpaceParticipant] Must join as listener first (no chat token).");
    }
    if (!this.authToken) {
      throw new Error("[SpaceParticipant] No auth token available.");
    }
    if (!this.chatToken) {
      throw new Error("[SpaceParticipant] No chat token available.");
    }
    this.logger.info("[SpaceParticipant] Submitting speaker request...");
    const { session_uuid } = await submitSpeakerRequest({
      broadcastId: this.spaceId,
      chatToken: this.chatToken,
      authToken: this.authToken
    });
    this.sessionUUID = session_uuid;
    this.logger.info("[SpaceParticipant] Speaker request submitted =>", session_uuid);
    return { sessionUUID: session_uuid };
  }
  /**
   * Cancels a previously submitted speaker request using /audiospace/request/cancel.
   * This requires a valid sessionUUID from requestSpeaker() first.
   */
  async cancelSpeakerRequest() {
    if (!this.sessionUUID) {
      throw new Error(
        "[SpaceParticipant] No sessionUUID; cannot cancel a speaker request that was never submitted."
      );
    }
    if (!this.authToken) {
      throw new Error("[SpaceParticipant] No auth token available.");
    }
    if (!this.chatToken) {
      throw new Error("[SpaceParticipant] No chat token available.");
    }
    await cancelSpeakerRequest({
      broadcastId: this.spaceId,
      sessionUUID: this.sessionUUID,
      chatToken: this.chatToken,
      authToken: this.authToken
    });
    this.logger.info("[SpaceParticipant] Speaker request canceled =>", this.sessionUUID);
    this.sessionUUID = void 0;
  }
  /**
   * Once the host approves our speaker request, we perform Janus negotiation
   * to become a speaker.
   */
  async becomeSpeaker() {
    if (!this.sessionUUID) {
      throw new Error("[SpaceParticipant] No sessionUUID (did you call requestSpeaker()?).");
    }
    this.logger.info("[SpaceParticipant] Negotiating speaker role via Janus...");
    const turnServers = await getTurnServers(this.cookie);
    this.logger.debug("[SpaceParticipant] turnServers =>", turnServers);
    const nego = await negotiateGuestStream({
      broadcastId: this.spaceId,
      sessionUUID: this.sessionUUID,
      authToken: this.authToken,
      cookie: this.cookie
    });
    this.janusJwt = nego.janus_jwt;
    this.webrtcGwUrl = nego.webrtc_gw_url;
    this.logger.debug("[SpaceParticipant] webrtcGwUrl =>", this.webrtcGwUrl);
    this.janusClient = new JanusClient({
      webrtcUrl: this.webrtcGwUrl,
      roomId: this.spaceId,
      credential: this.janusJwt,
      userId: turnServers.username.split(":")[1],
      streamName: this.spaceId,
      turnServers,
      logger: this.logger
    });
    await this.janusClient.initializeGuestSpeaker(this.sessionUUID);
    this.janusClient.on("audioDataFromSpeaker", (data) => {
      this.logger.debug("[SpaceParticipant] Received speaker audio =>", data.userId);
      this.handleAudioData(data);
    });
    this.logger.info("[SpaceParticipant] Now speaker on the Space =>", this.spaceId);
    for (const { plugin } of this.plugins) {
      plugin.onJanusReady?.(this.janusClient);
    }
  }
  /**
   * Removes self from the speaker role and transitions back to a listener.
   */
  async removeFromSpeaker() {
    if (!this.sessionUUID) {
      throw new Error("[SpaceParticipant] No sessionUUID; cannot remove from speaker role.");
    }
    if (!this.authToken || !this.chatToken) {
      throw new Error("[SpaceParticipant] Missing authToken or chatToken.");
    }
    this.logger.info("[SpaceParticipant] Removing from speaker role...");
    if (this.janusClient) {
      await this.janusClient.stop();
      this.janusClient = void 0;
    }
    this.logger.info("[SpaceParticipant] Successfully removed from speaker role.");
  }
  /**
   * Leaves the Space gracefully:
   * - Stop Janus if we were a speaker
   * - Stop watching as a viewer
   * - Disconnect chat
   */
  async leaveSpace() {
    this.logger.info("[SpaceParticipant] Leaving space...");
    if (this.janusClient) {
      await this.janusClient.stop();
      this.janusClient = void 0;
    }
    if (this.watchSession && this.cookie) {
      await stopWatching(this.watchSession, this.cookie);
    }
    if (this.chatClient) {
      await this.chatClient.disconnect();
      this.chatClient = void 0;
    }
    this.logger.info("[SpaceParticipant] Left space =>", this.spaceId);
  }
  /**
   * Pushes PCM audio frames if we're speaker; otherwise logs a warning.
   */
  pushAudio(samples, sampleRate) {
    if (!this.janusClient) {
      this.logger.warn("[SpaceParticipant] Not a speaker yet; ignoring pushAudio.");
      return;
    }
    this.janusClient.pushLocalAudio(samples, sampleRate);
  }
  /**
   * Internal handler for incoming PCM frames from Janus, forwarded to plugin.onAudioData if present.
   */
  handleAudioData(data) {
    for (const { plugin } of this.plugins) {
      plugin.onAudioData?.(data);
    }
  }
  /**
   * Sets up chat events: "occupancyUpdate", "newSpeakerAccepted", etc.
   */
  setupChatEvents() {
    if (!this.chatClient) return;
    setupCommonChatEvents(this.chatClient, this.logger, this);
    this.chatClient.on("newSpeakerAccepted", ({ userId }) => {
      this.logger.debug("[SpaceParticipant] newSpeakerAccepted =>", userId);
      if (!this.janusClient) {
        this.logger.warn("[SpaceParticipant] No janusClient yet; ignoring new speaker...");
        return;
      }
      if (userId === this.janusClient.getHandleId()) {
        return;
      }
      this.janusClient.subscribeSpeaker(userId).catch((err) => {
        this.logger.error("[SpaceParticipant] subscribeSpeaker error =>", err);
      });
    });
  }
  /**
   * Mute self if we are speaker: calls /audiospace/muteSpeaker with our sessionUUID.
   */
  async muteSelf() {
    if (!this.authToken || !this.chatToken) {
      throw new Error("[SpaceParticipant] Missing authToken or chatToken.");
    }
    if (!this.sessionUUID) {
      throw new Error("[SpaceParticipant] No sessionUUID; are you a speaker?");
    }
    await muteSpeaker({
      broadcastId: this.spaceId,
      sessionUUID: this.sessionUUID,
      chatToken: this.chatToken,
      authToken: this.authToken
    });
    this.logger.info("[SpaceParticipant] Successfully muted self.");
  }
  /**
   * Unmute self if we are speaker: calls /audiospace/unmuteSpeaker with our sessionUUID.
   */
  async unmuteSelf() {
    if (!this.authToken || !this.chatToken) {
      throw new Error("[SpaceParticipant] Missing authToken or chatToken.");
    }
    if (!this.sessionUUID) {
      throw new Error("[SpaceParticipant] No sessionUUID; are you a speaker?");
    }
    await unmuteSpeaker({
      broadcastId: this.spaceId,
      sessionUUID: this.sessionUUID,
      chatToken: this.chatToken,
      authToken: this.authToken
    });
    this.logger.info("[SpaceParticipant] Successfully unmuted self.");
  }
};

// src/client/spaces/plugins/SttTtsPlugin.ts
import { logger } from "@elizaos/core";

// src/client/spaces/plugins/IdleMonitorPlugin.ts
var IdleMonitorPlugin = class {
  /**
   * @param idleTimeoutMs The duration (in ms) of total silence before triggering idle. (Default: 60s)
   * @param checkEveryMs  How frequently (in ms) to check for silence. (Default: 10s)
   */
  constructor(idleTimeoutMs = 6e4, checkEveryMs = 1e4) {
    this.idleTimeoutMs = idleTimeoutMs;
    this.checkEveryMs = checkEveryMs;
    this.lastSpeakerAudioMs = Date.now();
    this.lastLocalAudioMs = Date.now();
  }
  /**
   * Called immediately after .use(plugin).
   * Allows for minimal setup, including obtaining a debug logger if desired.
   */
  onAttach(params) {
    this.space = params.space;
    const debug = params.pluginConfig?.debug ?? false;
    this.logger = new Logger(debug);
    this.logger.info("[IdleMonitorPlugin] onAttach => plugin attached");
  }
  /**
   * Called once the space has fully initialized (basic mode).
   * We set up idle checks and override pushAudio to detect local audio activity.
   */
  init(params) {
    this.space = params.space;
    this.logger?.info("[IdleMonitorPlugin] init => setting up idle checks");
    this.space.on("audioDataFromSpeaker", (_data) => {
      this.lastSpeakerAudioMs = Date.now();
    });
    const originalPushAudio = this.space.pushAudio.bind(this.space);
    this.space.pushAudio = (samples, sampleRate) => {
      this.lastLocalAudioMs = Date.now();
      originalPushAudio(samples, sampleRate);
    };
    this.checkInterval = setInterval(() => this.checkIdle(), this.checkEveryMs);
  }
  /**
   * Checks if we've exceeded idleTimeoutMs with no audio activity.
   * If so, emits an 'idleTimeout' event on the space with { idleMs } info.
   */
  checkIdle() {
    const now = Date.now();
    const lastAudio = Math.max(this.lastSpeakerAudioMs, this.lastLocalAudioMs);
    const idleMs = now - lastAudio;
    if (idleMs >= this.idleTimeoutMs) {
      this.logger?.warn(`[IdleMonitorPlugin] idleTimeout => no audio for ${idleMs}ms`);
      this.space?.emit("idleTimeout", { idleMs });
    }
  }
  /**
   * Returns how many milliseconds have passed since any audio was detected (local or speaker).
   */
  getIdleTimeMs() {
    const now = Date.now();
    const lastAudio = Math.max(this.lastSpeakerAudioMs, this.lastLocalAudioMs);
    return now - lastAudio;
  }
  /**
   * Cleans up resources (interval) when the plugin is removed or space stops.
   */
  cleanup() {
    this.logger?.info("[IdleMonitorPlugin] cleanup => stopping idle checks");
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = void 0;
    }
  }
};

// src/sttTtsSpaces.ts
import { spawn } from "node:child_process";
import {
  ChannelType,
  EventType,
  ModelType,
  createUniqueUuid,
  logger as logger2
} from "@elizaos/core";
var VOLUME_WINDOW_SIZE = 100;
var SPEAKING_THRESHOLD = 0.05;
var SILENCE_DETECTION_THRESHOLD_MS = 1e3;
var SttTtsPlugin2 = class {
  constructor() {
    this.name = "SttTtsPlugin";
    this.description = "Speech-to-text (OpenAI) + conversation + TTS (ElevenLabs)";
    /**
     * userId => arrayOfChunks (PCM Int16)
     */
    this.pcmBuffers = /* @__PURE__ */ new Map();
    // TTS queue for sequentially speaking
    this.ttsQueue = [];
    this.isSpeaking = false;
    this.isProcessingAudio = false;
    this.userSpeakingTimer = null;
    this.ttsAbortController = null;
  }
  onAttach(_space) {
    logger2.log("[SttTtsPlugin] onAttach => space was attached");
  }
  async init(params) {
    logger2.log("[SttTtsPlugin] init => Space fully ready. Subscribing to events.");
    this.space = params.space;
    this.janus = this.space?.janusClient;
    const config = params.pluginConfig;
    this.runtime = config?.runtime;
    this.spaceId = config?.spaceId;
    this.volumeBuffers = /* @__PURE__ */ new Map();
  }
  /**
   * Called whenever we receive PCM from a speaker
   */
  onAudioData(data) {
    if (this.isProcessingAudio) {
      return;
    }
    const silenceThreshold = 50;
    let maxVal = 0;
    for (let i = 0; i < data.samples.length; i++) {
      const val = Math.abs(data.samples[i]);
      if (val > maxVal) maxVal = val;
    }
    if (maxVal < silenceThreshold) {
      return;
    }
    if (this.userSpeakingTimer) {
      clearTimeout(this.userSpeakingTimer);
    }
    let arr = this.pcmBuffers.get(data.userId);
    if (!arr) {
      arr = [];
      this.pcmBuffers.set(data.userId, arr);
    }
    arr.push(data.samples);
    if (!this.isSpeaking) {
      this.userSpeakingTimer = setTimeout(() => {
        logger2.log("[SttTtsPlugin] start processing audio for user =>", data.userId);
        this.userSpeakingTimer = null;
        this.processAudio(data.userId).catch(
          (err) => logger2.error("[SttTtsPlugin] handleSilence error =>", err)
        );
      }, SILENCE_DETECTION_THRESHOLD_MS);
    } else {
      let volumeBuffer = this.volumeBuffers.get(data.userId);
      if (!volumeBuffer) {
        volumeBuffer = [];
        this.volumeBuffers.set(data.userId, volumeBuffer);
      }
      const samples = new Int16Array(
        data.samples.buffer,
        data.samples.byteOffset,
        data.samples.length / 2
      );
      const maxAmplitude = Math.max(...samples.map(Math.abs)) / 32768;
      volumeBuffer.push(maxAmplitude);
      if (volumeBuffer.length > VOLUME_WINDOW_SIZE) {
        volumeBuffer.shift();
      }
      const avgVolume = volumeBuffer.reduce((sum, v) => sum + v, 0) / VOLUME_WINDOW_SIZE;
      if (avgVolume > SPEAKING_THRESHOLD) {
        volumeBuffer.length = 0;
        if (this.ttsAbortController) {
          this.ttsAbortController.abort();
          this.isSpeaking = false;
          logger2.log("[SttTtsPlugin] TTS playback interrupted");
        }
      }
    }
  }
  // /src/sttTtsPlugin.ts
  async convertPcmToWavInMemory(pcmData, sampleRate) {
    const numChannels = 1;
    const byteRate = sampleRate * numChannels * 2;
    const blockAlign = numChannels * 2;
    const dataSize = pcmData.length * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    this.writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, "WAVE");
    this.writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    this.writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);
    let offset = 44;
    for (let i = 0; i < pcmData.length; i++, offset += 2) {
      view.setInt16(offset, pcmData[i], true);
    }
    return buffer;
  }
  writeString(view, offset, text) {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  }
  /**
   * On speaker silence => flush STT => GPT => TTS => push to Janus
   */
  async processAudio(userId) {
    if (this.isProcessingAudio) {
      return;
    }
    this.isProcessingAudio = true;
    try {
      logger2.log("[SttTtsPlugin] Starting audio processing for user:", userId);
      const chunks = this.pcmBuffers.get(userId) || [];
      this.pcmBuffers.clear();
      if (!chunks.length) {
        logger2.warn("[SttTtsPlugin] No audio chunks for user =>", userId);
        return;
      }
      logger2.log(`[SttTtsPlugin] Flushing STT buffer for user=${userId}, chunks=${chunks.length}`);
      const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
      const merged = new Int16Array(totalLen);
      let offset = 0;
      for (const c of chunks) {
        merged.set(c, offset);
        offset += c.length;
      }
      const wavBuffer = await this.convertPcmToWavInMemory(merged, 48e3);
      const sttText = await this.runtime.useModel(ModelType.TRANSCRIPTION, wavBuffer);
      logger2.log(`[SttTtsPlugin] Transcription result: "${sttText}"`);
      if (!sttText || !sttText.trim()) {
        logger2.warn("[SttTtsPlugin] No speech recognized for user =>", userId);
        return;
      }
      logger2.log(`[SttTtsPlugin] STT => user=${userId}, text="${sttText}"`);
      await this.handleUserMessage(sttText, userId);
    } catch (error) {
      logger2.error("[SttTtsPlugin] processAudio error =>", error);
    } finally {
      this.isProcessingAudio = false;
    }
  }
  /**
   * Public method to queue a TTS request
   */
  async speakText(text) {
    this.ttsQueue.push(text);
    if (!this.isSpeaking) {
      this.isSpeaking = true;
      this.processTtsQueue().catch((err) => {
        logger2.error("[SttTtsPlugin] processTtsQueue error =>", err);
      });
    }
  }
  /**
   * Process TTS requests one by one
   */
  async processTtsQueue() {
    while (this.ttsQueue.length > 0) {
      const text = this.ttsQueue.shift();
      if (!text) continue;
      this.ttsAbortController = new AbortController();
      const { signal } = this.ttsAbortController;
      try {
        const responseStream = await this.runtime.useModel(ModelType.TEXT_TO_SPEECH, text);
        if (!responseStream) {
          logger2.error("[SttTtsPlugin] TTS responseStream is null");
          continue;
        }
        logger2.log("[SttTtsPlugin] Received ElevenLabs TTS stream");
        await this.streamTtsStreamToJanus(responseStream, 48e3, signal);
        if (signal.aborted) {
          logger2.log("[SttTtsPlugin] TTS interrupted after streaming");
          return;
        }
      } catch (err) {
        logger2.error("[SttTtsPlugin] TTS streaming error =>", err);
      } finally {
        this.ttsAbortController = null;
      }
    }
    this.isSpeaking = false;
  }
  /**
   * Handle User Message
   */
  async handleUserMessage(userText, userId) {
    if (!userText || userText.trim() === "") {
      return null;
    }
    const numericId = userId.replace("tw-", "");
    const roomId = createUniqueUuid(this.runtime, `twitter_generate_room-${this.spaceId}`);
    const userUuid = createUniqueUuid(this.runtime, numericId);
    const entity = await this.runtime.getEntityById(userUuid);
    if (!entity) {
      await this.runtime.createEntity({
        id: userUuid,
        names: [userId],
        agentId: this.runtime.agentId
      });
    }
    await this.runtime.ensureRoomExists({
      id: roomId,
      name: "Twitter Space",
      source: "twitter",
      type: ChannelType.VOICE_GROUP,
      channelId: null,
      serverId: this.spaceId
    });
    await this.runtime.ensureParticipantInRoom(userUuid, roomId);
    const memory = {
      id: createUniqueUuid(this.runtime, `${roomId}-voice-message-${Date.now()}`),
      agentId: this.runtime.agentId,
      content: {
        text: userText,
        source: "twitter"
      },
      userId: userUuid,
      roomId,
      createdAt: Date.now()
    };
    const callback = async (content, _files = []) => {
      try {
        const responseMemory = {
          id: createUniqueUuid(this.runtime, `${memory.id}-voice-response-${Date.now()}`),
          entityId: this.runtime.agentId,
          agentId: this.runtime.agentId,
          content: {
            ...content,
            user: this.runtime.character.name,
            inReplyTo: memory.id,
            isVoiceMessage: true
          },
          roomId,
          createdAt: Date.now()
        };
        if (responseMemory.content.text?.trim()) {
          await this.runtime.createMemory(responseMemory);
          this.isProcessingAudio = false;
          this.volumeBuffers.clear();
          await this.speakText(content.text);
        }
        return [responseMemory];
      } catch (error) {
        console.error("Error in voice message callback:", error);
        return [];
      }
    };
    this.runtime.emitEvent(EventType.VOICE_MESSAGE_RECEIVED, {
      runtime: this.runtime,
      message: memory,
      callback
    });
  }
  /**
   * Convert MP3 => PCM via ffmpeg
   */
  convertMp3ToPcm(mp3Buf, outRate) {
    return new Promise((resolve, reject) => {
      const ff = spawn("ffmpeg", [
        "-i",
        "pipe:0",
        "-f",
        "s16le",
        "-ar",
        outRate.toString(),
        "-ac",
        "1",
        "pipe:1"
      ]);
      let raw = Buffer.alloc(0);
      ff.stdout.on("data", (chunk) => {
        raw = Buffer.concat([raw, chunk]);
      });
      ff.stderr.on("data", () => {
      });
      ff.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`ffmpeg error code=${code}`));
          return;
        }
        const samples = new Int16Array(raw.buffer, raw.byteOffset, raw.byteLength / 2);
        resolve(samples);
      });
      ff.stdin.write(mp3Buf);
      ff.stdin.end();
    });
  }
  /**
   * Push PCM back to Janus in small frames
   * We'll do 10ms @48k => 960 samples per frame
   */
  async streamToJanus(samples, sampleRate) {
    const FRAME_SIZE = Math.floor(sampleRate * 0.01);
    for (let offset = 0; offset + FRAME_SIZE <= samples.length; offset += FRAME_SIZE) {
      if (this.ttsAbortController?.signal.aborted) {
        logger2.log("[SttTtsPlugin] streamToJanus interrupted");
        return;
      }
      const frame = new Int16Array(FRAME_SIZE);
      frame.set(samples.subarray(offset, offset + FRAME_SIZE));
      this.janus?.pushLocalAudio(frame, sampleRate, 1);
      await new Promise((r) => setTimeout(r, 10));
    }
  }
  async streamTtsStreamToJanus(stream, sampleRate, signal) {
    const chunks = [];
    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => {
        if (signal.aborted) {
          logger2.log("[SttTtsPlugin] Stream aborted, stopping playback");
          stream.destroy();
          reject(new Error("TTS streaming aborted"));
          return;
        }
        chunks.push(chunk);
      });
      stream.on("end", async () => {
        if (signal.aborted) {
          logger2.log("[SttTtsPlugin] Stream ended but was aborted");
          return reject(new Error("TTS streaming aborted"));
        }
        const mp3Buffer = Buffer.concat(chunks);
        try {
          const pcmSamples = await this.convertMp3ToPcm(mp3Buffer, sampleRate);
          await this.streamToJanus(pcmSamples, sampleRate);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      stream.on("error", (error) => {
        logger2.error("[SttTtsPlugin] Error in TTS stream", error);
        reject(error);
      });
    });
  }
  cleanup() {
    logger2.log("[SttTtsPlugin] cleanup => releasing resources");
    this.pcmBuffers.clear();
    this.userSpeakingTimer = null;
    this.ttsQueue = [];
    this.isSpeaking = false;
    this.volumeBuffers.clear();
  }
};

// src/utils.ts
import {
  ChannelType as ChannelType2,
  ModelType as ModelType2,
  composePrompt,
  createUniqueUuid as createUniqueUuid2,
  logger as logger3
} from "@elizaos/core";
async function generateFiller(runtime, fillerType) {
  try {
    const prompt = composePrompt({
      state: {
        values: {
          fillerType
        }
      },
      template: `
# INSTRUCTIONS:
You are generating a short filler message for a Twitter Space. The filler type is "{{fillerType}}".
Keep it brief, friendly, and relevant. No more than two sentences.
Only return the text, no additional formatting.

---
`
    });
    const output = await runtime.useModel(ModelType2.TEXT_SMALL, {
      prompt
    });
    return output.trim();
  } catch (err) {
    logger3.error("[generateFiller] Error generating filler:", err);
    return "";
  }
}
async function speakFiller(runtime, sttTtsPlugin, fillerType, sleepAfterMs = 3e3) {
  if (!sttTtsPlugin) return;
  const text = await generateFiller(runtime, fillerType);
  if (!text) return;
  logger3.log(`[Space] Filler (${fillerType}) => ${text}`);
  await sttTtsPlugin.speakText(text);
  if (sleepAfterMs > 0) {
    await new Promise((res) => setTimeout(res, sleepAfterMs));
  }
}
async function generateTopicsIfEmpty(runtime) {
  try {
    const prompt = composePrompt({
      state: {},
      template: `
# INSTRUCTIONS:
Please generate 5 short topic ideas for a Twitter Space about technology or random interesting subjects.
Return them as a comma-separated list, no additional formatting or numbering.

Example:
"AI Advances, Futuristic Gadgets, Space Exploration, Quantum Computing, Digital Ethics"
---
`
    });
    const response = await runtime.useModel(ModelType2.TEXT_SMALL, {
      prompt
    });
    const topics = response.split(",").map((t) => t.trim()).filter(Boolean);
    return topics.length ? topics : ["Random Tech Chat", "AI Thoughts"];
  } catch (err) {
    logger3.error("[generateTopicsIfEmpty] GPT error =>", err);
    return ["Random Tech Chat", "AI Thoughts"];
  }
}
async function isAgentInSpace(client, spaceId) {
  const space = await client.twitterClient.getAudioSpaceById(spaceId);
  const agentName = client.state.TWITTER_USERNAME;
  return space.participants.listeners.some(
    (participant) => participant.twitter_screen_name === agentName
  ) || space.participants.speakers.some((participant) => participant.twitter_screen_name === agentName);
}

// src/spaces.ts
var TwitterSpaceClient = class {
  constructor(client, runtime) {
    this.spaceStatus = "idle" /* IDLE */;
    this.spaceParticipant = null;
    this.participantStatus = "listener" /* LISTENER */;
    /**
     * We now store an array of active speakers, not just 1
     */
    this.activeSpeakers = [];
    this.speakerQueue = [];
    this.client = client;
    this.twitterClient = client.twitterClient;
    this.runtime = runtime;
    this.sttTtsPlugin = new SttTtsPlugin2();
    const charSpaces = runtime.character.settings?.twitter?.spaces || {};
    this.decisionOptions = {
      maxSpeakers: charSpaces.maxSpeakers ?? 1,
      typicalDurationMinutes: charSpaces.typicalDurationMinutes ?? 30,
      idleKickTimeoutMs: charSpaces.idleKickTimeoutMs ?? 5 * 6e4,
      minIntervalBetweenSpacesMinutes: charSpaces.minIntervalBetweenSpacesMinutes ?? 60,
      enableIdleMonitor: charSpaces.enableIdleMonitor !== false,
      enableRecording: charSpaces.enableRecording !== false,
      enableSpaceHosting: charSpaces.enableSpaceHosting || false,
      speakerMaxDurationMs: charSpaces.speakerMaxDurationMs ?? 4 * 6e4
    };
  }
  /**
   * Periodic check to launch or manage space
   */
  async startPeriodicSpaceCheck() {
    logger4.log("[Space] Starting periodic check routine...");
    const interval = 2e4;
    const routine = async () => {
      try {
        if (this.spaceStatus === "idle" /* IDLE */) {
          if (this.decisionOptions.enableSpaceHosting) {
            const launch = await this.shouldLaunchSpace();
            if (launch) {
              const config = await this.generateSpaceConfig();
              await this.startSpace(config);
            }
          }
        } else {
          if (this.spaceStatus === "hosting" /* HOSTING */) {
            await this.manageCurrentSpace();
          } else if (this.spaceStatus === "participating" /* PARTICIPATING */) {
            await this.manageParticipant();
          }
        }
        this.checkInterval = setTimeout(routine, interval);
      } catch (error) {
        logger4.error("[Space] Error in routine =>", error);
        this.checkInterval = setTimeout(routine, interval);
      }
    };
    routine();
  }
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearTimeout(this.checkInterval);
      this.checkInterval = void 0;
    }
  }
  async shouldLaunchSpace() {
    const now = Date.now();
    if (this.lastSpaceEndedAt) {
      const minIntervalMs = (this.decisionOptions.minIntervalBetweenSpacesMinutes ?? 60) * 6e4;
      if (now - this.lastSpaceEndedAt < minIntervalMs) {
        logger4.log("[Space] Too soon since last space => skip");
        return false;
      }
    }
    logger4.log("[Space] Deciding to launch a new Space...");
    return true;
  }
  async generateSpaceConfig() {
    let chosenTopic = "Random Tech Chat";
    let topics = this.runtime.character.topics || [];
    if (!topics.length) {
      const newTopics = await generateTopicsIfEmpty(this.client.runtime);
      topics = newTopics;
    }
    chosenTopic = topics[Math.floor(Math.random() * topics.length)];
    return {
      record: this.decisionOptions.enableRecording,
      mode: "INTERACTIVE",
      title: chosenTopic,
      description: `Discussion about ${chosenTopic}`,
      languages: ["en"]
    };
  }
  async startSpace(config) {
    logger4.log("[Space] Starting a new Twitter Space...");
    try {
      this.currentSpace = new Space(this.twitterClient);
      this.spaceStatus = "idle" /* IDLE */;
      this.spaceId = void 0;
      this.startedAt = Date.now();
      this.activeSpeakers = [];
      this.speakerQueue = [];
      const broadcastInfo = await this.currentSpace.initialize(config);
      this.spaceId = broadcastInfo.room_id;
      const userId = this.client.profile.id;
      const worldId = createUniqueUuid3(this.runtime, userId);
      const spaceRoomId = createUniqueUuid3(this.runtime, `${userId}-space-${this.spaceId}`);
      await this.runtime.ensureWorldExists({
        id: worldId,
        name: `${this.client.profile.username}'s Twitter`,
        agentId: this.runtime.agentId,
        serverId: userId,
        metadata: {
          ownership: { ownerId: userId },
          twitter: {
            username: this.client.profile.username,
            id: userId
          }
        }
      });
      await this.runtime.ensureRoomExists({
        id: spaceRoomId,
        name: config.title || "Twitter Space",
        source: "twitter",
        type: ChannelType3.GROUP,
        channelId: this.spaceId,
        serverId: userId,
        worldId,
        metadata: {
          spaceInfo: {
            title: config.title,
            description: config.description,
            startedAt: Date.now(),
            mode: config.mode,
            languages: config.languages,
            isRecording: config.record
          }
        }
      });
      if (this.runtime.getModel(ModelType3.TEXT_TO_SPEECH) && this.runtime.getModel(ModelType3.TRANSCRIPTION)) {
        logger4.log("[Space] Using SttTtsPlugin");
        this.currentSpace.use(this.sttTtsPlugin, {
          runtime: this.runtime,
          spaceId: this.spaceId
        });
      }
      if (this.decisionOptions.enableIdleMonitor) {
        logger4.log("[Space] Using IdleMonitorPlugin");
        this.currentSpace.use(
          new IdleMonitorPlugin(this.decisionOptions.idleKickTimeoutMs ?? 6e4, 1e4)
        );
      }
      this.spaceStatus = "hosting" /* HOSTING */;
      const spaceUrl = broadcastInfo.share_url.replace("broadcasts", "spaces");
      await this.twitterClient.sendTweet(spaceUrl);
      logger4.log(`[Space] Space started => ${spaceUrl}`);
      await speakFiller(this.client.runtime, this.sttTtsPlugin, "WELCOME");
      this.currentSpace.on("occupancyUpdate", (update) => {
        logger4.log(`[Space] Occupancy => ${update.occupancy} participant(s).`);
      });
      this.currentSpace.on("speakerRequest", async (req) => {
        logger4.log(`[Space] Speaker request from @${req.username} (${req.userId}).`);
        await this.handleSpeakerRequest(req);
      });
      this.currentSpace.on("idleTimeout", async (info) => {
        logger4.log(`[Space] idleTimeout => no audio for ${info.idleMs} ms.`);
        await speakFiller(this.client.runtime, this.sttTtsPlugin, "IDLE_ENDING");
        await this.stopSpace();
      });
      process.on("SIGINT", async () => {
        logger4.log("[Space] SIGINT => stopping space");
        await speakFiller(this.client.runtime, this.sttTtsPlugin, "CLOSING");
        await this.stopSpace();
        process.exit(0);
      });
    } catch (error) {
      logger4.error("[Space] Error launching Space =>", error);
      this.spaceStatus = "idle" /* IDLE */;
      throw error;
    }
  }
  /**
   * Periodic management: check durations, remove extras, maybe accept new from queue
   */
  async manageCurrentSpace() {
    if (!this.spaceId || !this.currentSpace) return;
    try {
      const audioSpace = await this.twitterClient.getAudioSpaceById(this.spaceId);
      const { participants } = audioSpace;
      const numSpeakers = participants.speakers?.length || 0;
      const totalListeners = participants.listeners?.length || 0;
      const maxDur = this.decisionOptions.speakerMaxDurationMs ?? 24e4;
      const now = Date.now();
      for (let i = this.activeSpeakers.length - 1; i >= 0; i--) {
        const speaker = this.activeSpeakers[i];
        const elapsed = now - speaker.startTime;
        if (elapsed > maxDur) {
          logger4.log(`[Space] Speaker @${speaker.username} exceeded max duration => removing`);
          await this.removeSpeaker(speaker.userId);
          this.activeSpeakers.splice(i, 1);
          await speakFiller(this.client.runtime, this.sttTtsPlugin, "SPEAKER_LEFT");
        }
      }
      await this.acceptSpeakersFromQueueIfNeeded();
      if (numSpeakers > (this.decisionOptions.maxSpeakers ?? 1)) {
        logger4.log("[Space] More than maxSpeakers => removing extras...");
        await this.kickExtraSpeakers(participants.speakers);
      }
      const elapsedMinutes = (now - (this.startedAt || 0)) / 6e4;
      if (elapsedMinutes > (this.decisionOptions.typicalDurationMinutes ?? 30) || numSpeakers === 0 && totalListeners === 0 && elapsedMinutes > 5) {
        logger4.log("[Space] Condition met => stopping the Space...");
        await speakFiller(this.client.runtime, this.sttTtsPlugin, "CLOSING", 4e3);
        await this.stopSpace();
      }
    } catch (error) {
      logger4.error("[Space] Error in manageCurrentSpace =>", error);
    }
  }
  /**
   * If we have available slots, accept new speakers from the queue
   */
  async acceptSpeakersFromQueueIfNeeded() {
    const ms = this.decisionOptions.maxSpeakers ?? 1;
    while (this.speakerQueue.length > 0 && this.activeSpeakers.length < ms) {
      const nextReq = this.speakerQueue.shift();
      if (nextReq) {
        await speakFiller(this.client.runtime, this.sttTtsPlugin, "PRE_ACCEPT");
        await this.acceptSpeaker(nextReq);
      }
    }
  }
  async handleSpeakerRequest(req) {
    if (!this.spaceId || !this.currentSpace) return;
    const audioSpace = await this.twitterClient.getAudioSpaceById(this.spaceId);
    const janusSpeakers = audioSpace?.participants?.speakers || [];
    if (janusSpeakers.length < (this.decisionOptions.maxSpeakers ?? 1)) {
      logger4.log(`[Space] Accepting speaker @${req.username} now`);
      await speakFiller(this.client.runtime, this.sttTtsPlugin, "PRE_ACCEPT");
      await this.acceptSpeaker(req);
    } else {
      logger4.log(`[Space] Adding speaker @${req.username} to the queue`);
      this.speakerQueue.push(req);
    }
  }
  async acceptSpeaker(req) {
    if (!this.currentSpace) return;
    try {
      await this.currentSpace.approveSpeaker(req.userId, req.sessionUUID);
      this.activeSpeakers.push({
        userId: req.userId,
        sessionUUID: req.sessionUUID,
        username: req.username,
        startTime: Date.now()
      });
      logger4.log(`[Space] Speaker @${req.username} is now live`);
    } catch (err) {
      logger4.error(`[Space] Error approving speaker @${req.username}:`, err);
    }
  }
  async removeSpeaker(userId) {
    if (!this.currentSpace) return;
    try {
      await this.currentSpace.removeSpeaker(userId);
      logger4.log(`[Space] Removed speaker userId=${userId}`);
    } catch (error) {
      logger4.error(`[Space] Error removing speaker userId=${userId} =>`, error);
    }
  }
  /**
   * If more than maxSpeakers are found, remove extras
   * Also update activeSpeakers array
   */
  async kickExtraSpeakers(speakers) {
    if (!this.currentSpace) return;
    const ms = this.decisionOptions.maxSpeakers ?? 1;
    const extras = speakers.slice(ms);
    for (const sp of extras) {
      logger4.log(`[Space] Removing extra speaker => userId=${sp.user_id}`);
      await this.removeSpeaker(sp.user_id);
      const idx = this.activeSpeakers.findIndex((s) => s.userId === sp.user_id);
      if (idx !== -1) {
        this.activeSpeakers.splice(idx, 1);
      }
    }
  }
  async stopSpace() {
    if (!this.currentSpace || this.spaceStatus !== "hosting" /* HOSTING */) return;
    try {
      logger4.log("[Space] Stopping the current Space...");
      await this.currentSpace.stop();
    } catch (err) {
      logger4.error("[Space] Error stopping Space =>", err);
    } finally {
      this.spaceStatus = "idle" /* IDLE */;
      this.spaceId = void 0;
      this.currentSpace = void 0;
      this.startedAt = void 0;
      this.lastSpaceEndedAt = Date.now();
      this.activeSpeakers = [];
      this.speakerQueue = [];
    }
  }
  async startParticipant(spaceId) {
    if (this.spaceStatus !== "idle" /* IDLE */) {
      logger4.warn("currently hosting/participating a space");
      return null;
    }
    this.spaceParticipant = new SpaceParticipant(this.client.twitterClient, {
      spaceId,
      debug: false
    });
    if (this.spaceParticipant) {
      try {
        await this.spaceParticipant.joinAsListener();
        this.spaceId = spaceId;
        this.spaceStatus = "participating" /* PARTICIPATING */;
        return spaceId;
      } catch (error) {
        logger4.error(`failed to join space ${error}`);
        return null;
      }
    }
  }
  async manageParticipant() {
    if (!this.spaceParticipant || !this.spaceId) {
      this.stopParticipant();
      return;
    }
    const isParticipant = await isAgentInSpace(this.client, this.spaceId);
    if (!isParticipant) {
      this.stopParticipant();
      return;
    }
    if (this.participantStatus === "listener" /* LISTENER */) {
      logger4.log("[SpaceParticipant] Checking if we should request to speak...");
      this.participantStatus = "pending" /* PENDING */;
      const { sessionUUID } = await this.spaceParticipant.requestSpeaker();
      const handleSpeakerRemove = async (evt) => {
        if (evt.sessionUUID === sessionUUID) {
          logger4.debug("[SpaceParticipant] Speaker removed:", evt);
          try {
            await this.spaceParticipant.removeFromSpeaker();
          } catch (err) {
            console.error("[SpaceParticipant] Failed to become speaker:", err);
          }
          this.participantStatus = "listener" /* LISTENER */;
          this.spaceParticipant?.off("newSpeakerRemoved", handleSpeakerRemove);
        }
      };
      this.spaceParticipant.on("newSpeakerRemoved", handleSpeakerRemove);
      this.waitForApproval(this.spaceParticipant, sessionUUID, 15e3).then(() => {
        this.participantStatus = "speaker" /* SPEAKER */;
        this.spaceParticipant.use(this.sttTtsPlugin, {
          runtime: this.runtime,
          spaceId: this.spaceId
        });
      }).catch(async (err) => {
        console.error("[SpaceParticipant] Approval error or timeout =>", err);
        this.participantStatus = "listener" /* LISTENER */;
        try {
          await this.spaceParticipant.cancelSpeakerRequest();
          logger4.debug("[SpaceParticipant] Speaker request canceled after timeout or error.");
        } catch (cancelErr) {
          console.error("[SpaceParticipant] Could not cancel the request =>", cancelErr);
        }
      });
    }
  }
  async stopParticipant() {
    if (!this.spaceParticipant || this.spaceStatus !== "participating" /* PARTICIPATING */) return;
    try {
      logger4.log("[SpaceParticipant] Stopping the current space participant...");
      await this.spaceParticipant.leaveSpace();
    } catch (err) {
      logger4.error("[SpaceParticipant] Error stopping space participant =>", err);
    } finally {
      this.spaceStatus = "idle" /* IDLE */;
      this.participantStatus = "listener" /* LISTENER */;
      this.spaceId = void 0;
      this.spaceParticipant = void 0;
    }
  }
  /**
   * waitForApproval waits until "newSpeakerAccepted" matches our sessionUUID,
   * then calls becomeSpeaker() or rejects after a given timeout.
   */
  async waitForApproval(participant, sessionUUID, timeoutMs = 1e4) {
    return new Promise((resolve, reject) => {
      let resolved = false;
      const handler = async (evt) => {
        if (evt.sessionUUID === sessionUUID) {
          resolved = true;
          participant.off("newSpeakerAccepted", handler);
          try {
            await participant.becomeSpeaker();
            logger4.debug("[SpaceParticipant] Successfully became speaker!");
            resolve();
          } catch (err) {
            reject(err);
          }
        }
      };
      participant.on("newSpeakerAccepted", handler);
      setTimeout(() => {
        if (!resolved) {
          participant.off("newSpeakerAccepted", handler);
          reject(
            new Error(
              `[SpaceParticipant] Timed out waiting for speaker approval after ${timeoutMs}ms.`
            )
          );
        }
      }, timeoutMs);
    });
  }
};

// src/actions/spaceJoin.ts
var spaceJoin_default = {
  name: "JOIN_TWITTER_SPACE",
  similes: [
    "JOIN_TWITTER_SPACE",
    "JOIN_SPACE",
    "JOIN_TWITTER_AUDIO",
    "JOIN_TWITTER_CALL",
    "JOIN_LIVE_CONVERSATION"
  ],
  validate: async (runtime, message, _state) => {
    if (message?.content?.source !== "twitter") {
      return false;
    }
    if (!message?.content?.tweet) {
      return false;
    }
    const spaceEnable = runtime.getSetting("TWITTER_SPACES_ENABLE") === true;
    return spaceEnable;
  },
  description: "Join a Twitter Space to participate in live audio conversations.",
  handler: async (runtime, message, state, _options, callback, responses) => {
    if (!state) {
      logger5.error("State is not available.");
      return false;
    }
    for (const response of responses) {
      await callback(response.content);
    }
    const service = runtime.getService("twitter");
    if (!service) {
      throw new Error("Twitter service not found");
    }
    const manager = service.getClient(runtime.agentId, runtime.agentId);
    const client = manager.client;
    const spaceManager = manager.space;
    if (!spaceManager) {
      logger5.error("space action - no space manager found");
      return false;
    }
    if (spaceManager.spaceStatus !== "idle" /* IDLE */) {
      logger5.warn("currently hosting/participating a space");
      return false;
    }
    const tweet = message.content.tweet;
    if (!tweet) {
      logger5.warn("space action - no tweet found in message");
      return false;
    }
    async function joinSpaceByUrls(tweet2) {
      if (!tweet2.urls) return false;
      for (const url of tweet2.urls) {
        const match = url.match(/https:\/\/x\.com\/i\/spaces\/([a-zA-Z0-9]+)/);
        if (match) {
          const spaceId = match[1];
          try {
            const spaceInfo = await client.twitterClient.getAudioSpaceById(spaceId);
            if (spaceInfo?.metadata?.state === "Running") {
              const spaceJoined2 = await spaceManager.startParticipant(spaceId);
              return !!spaceJoined2;
            }
          } catch (error) {
            logger5.error("Error joining Twitter Space:", error);
          }
        }
      }
      return false;
    }
    async function joinSpaceByUserName(userName) {
      try {
        const tweetGenerator = client.twitterClient.getTweets(userName);
        for await (const userTweet of tweetGenerator) {
          if (await joinSpaceByUrls(userTweet)) {
            return true;
          }
        }
      } catch (error) {
        logger5.error(`Error fetching tweets for ${userName}:`, error);
      }
      return false;
    }
    const spaceJoined = await joinSpaceByUrls(tweet);
    if (spaceJoined) return true;
    const authorJoined = await joinSpaceByUserName(tweet.username);
    if (authorJoined) return true;
    const agentName = client.state.TWITTER_USERNAME;
    for (const mention of tweet.mentions) {
      if (mention.username !== agentName) {
        const mentionJoined = await joinSpaceByUserName(mention.username);
        if (mentionJoined) return true;
      }
    }
    await callback({
      text: "I couldn't determine which Twitter Space to join.",
      source: "twitter"
    });
    return false;
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Hey, let's join the 'Crypto Talk' Twitter Space!"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "On my way",
          actions: ["JOIN_TWITTER_SPACE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "@{{name2}}, jump into the 'AI Revolution' Space!"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Joining now!",
          actions: ["JOIN_TWITTER_SPACE"]
        }
      }
    ]
  ]
};

// src/base.ts
import {
  ChannelType as ChannelType4,
  createUniqueUuid as createUniqueUuid4,
  logger as logger6
} from "@elizaos/core";
var RequestQueue = class {
  constructor() {
    this.queue = [];
    this.processing = false;
  }
  /**
   * Asynchronously adds a request to the queue, then processes the queue.
   *
   * @template T
   * @param {() => Promise<T>} request - The request to be added to the queue
   * @returns {Promise<T>} - A promise that resolves with the result of the request or rejects with an error
   */
  async add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }
  /**
   * Asynchronously processes the queue of requests.
   *
   * @returns A promise that resolves when the queue has been fully processed.
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    this.processing = true;
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      try {
        await request();
      } catch (error) {
        console.error("Error processing request:", error);
        this.queue.unshift(request);
        await this.exponentialBackoff(this.queue.length);
      }
      await this.randomDelay();
    }
    this.processing = false;
  }
  /**
   * Implements an exponential backoff strategy for retrying a task.
   * @param {number} retryCount - The number of retries attempted so far.
   * @returns {Promise<void>} - A promise that resolves after a delay based on the retry count.
   */
  async exponentialBackoff(retryCount) {
    const delay = 2 ** retryCount * 1e3;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  /**
   * Asynchronous method that creates a random delay between 1500ms and 3500ms.
   *
   * @returns A Promise that resolves after the random delay has passed.
   */
  async randomDelay() {
    const delay = Math.floor(Math.random() * 2e3) + 1500;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
};
var _ClientBase = class _ClientBase {
  constructor(runtime, state) {
    this.lastCheckedTweetId = null;
    this.temperature = 0.5;
    this.requestQueue = new RequestQueue();
    this.callback = null;
    this.runtime = runtime;
    this.state = state;
    const username = state?.TWITTER_USERNAME || this.runtime.getSetting("TWITTER_USERNAME");
    if (_ClientBase._twitterClients[username]) {
      this.twitterClient = _ClientBase._twitterClients[username];
    } else {
      this.twitterClient = new Client();
      _ClientBase._twitterClients[username] = this.twitterClient;
    }
  }
  /**
   * Caches a tweet in the database.
   *
   * @param {Tweet} tweet - The tweet to cache.
   * @returns {Promise<void>} A promise that resolves once the tweet is cached.
   */
  async cacheTweet(tweet) {
    if (!tweet) {
      console.warn("Tweet is undefined, skipping cache");
      return;
    }
    this.runtime.setCache(`twitter/tweets/${tweet.id}`, tweet);
  }
  /**
   * Retrieves a cached tweet by its ID.
   * @param {string} tweetId - The ID of the tweet to retrieve from the cache.
   * @returns {Promise<Tweet | undefined>} A Promise that resolves to the cached tweet, or undefined if the tweet is not found in the cache.
   */
  async getCachedTweet(tweetId) {
    const cached = await this.runtime.getCache(`twitter/tweets/${tweetId}`);
    if (!cached) {
      return void 0;
    }
    return cached;
  }
  /**
   * Asynchronously retrieves a tweet with the specified ID.
   * If the tweet is found in the cache, it is returned from the cache.
   * If not, a request is made to the Twitter API to get the tweet, which is then cached and returned.
   * @param {string} tweetId - The ID of the tweet to retrieve.
   * @returns {Promise<Tweet>} A Promise that resolves to the retrieved tweet.
   */
  async getTweet(tweetId) {
    const cachedTweet = await this.getCachedTweet(tweetId);
    if (cachedTweet) {
      return cachedTweet;
    }
    const tweet = await this.requestQueue.add(() => this.twitterClient.getTweet(tweetId));
    await this.cacheTweet(tweet);
    return tweet;
  }
  /**
   * This method is called when the application is ready.
   * It throws an error indicating that it is not implemented in the base class
   * and should be implemented in the subclass.
   */
  onReady() {
    throw new Error("Not implemented in base class, please call from subclass");
  }
  /**
   * Parse the raw tweet data into a standardized Tweet object.
   */
  /**
   * Parses a raw tweet object into a structured Tweet object.
   *
   * @param {any} raw - The raw tweet object to parse.
   * @param {number} [depth=0] - The current depth of parsing nested quotes/retweets.
   * @param {number} [maxDepth=3] - The maximum depth allowed for parsing nested quotes/retweets.
   * @returns {Tweet} The parsed Tweet object.
   */
  parseTweet(raw, depth = 0, maxDepth = 3) {
    const canRecurse = depth < maxDepth;
    const quotedStatus = raw.quoted_status_result?.result && canRecurse ? this.parseTweet(raw.quoted_status_result.result, depth + 1, maxDepth) : void 0;
    const retweetedStatus = raw.retweeted_status_result?.result && canRecurse ? this.parseTweet(raw.retweeted_status_result.result, depth + 1, maxDepth) : void 0;
    const t = {
      bookmarkCount: raw.bookmarkCount ?? raw.legacy?.bookmark_count ?? void 0,
      conversationId: raw.conversationId ?? raw.legacy?.conversation_id_str,
      hashtags: raw.hashtags ?? raw.legacy?.entities?.hashtags ?? [],
      html: raw.html,
      id: raw.id ?? raw.rest_id ?? raw.legacy.id_str ?? raw.id_str ?? void 0,
      inReplyToStatus: raw.inReplyToStatus,
      inReplyToStatusId: raw.inReplyToStatusId ?? raw.legacy?.in_reply_to_status_id_str ?? void 0,
      isQuoted: raw.legacy?.is_quote_status === true,
      isPin: raw.isPin,
      isReply: raw.isReply,
      isRetweet: raw.legacy?.retweeted === true,
      isSelfThread: raw.isSelfThread,
      language: raw.legacy?.lang,
      likes: raw.legacy?.favorite_count ?? 0,
      name: raw.name ?? raw?.user_results?.result?.legacy?.name ?? raw.core?.user_results?.result?.legacy?.name,
      mentions: raw.mentions ?? raw.legacy?.entities?.user_mentions ?? [],
      permanentUrl: raw.permanentUrl ?? (raw.core?.user_results?.result?.legacy?.screen_name && raw.rest_id ? `https://x.com/${raw.core?.user_results?.result?.legacy?.screen_name}/status/${raw.rest_id}` : void 0),
      photos: raw.photos ?? (raw.legacy?.entities?.media?.filter((media) => media.type === "photo").map((media) => ({
        id: media.id_str || media.rest_id || media.legacy.id_str,
        url: media.media_url_https,
        alt_text: media.alt_text
      })) || []),
      place: raw.place,
      poll: raw.poll ?? null,
      quotedStatus,
      quotedStatusId: raw.quotedStatusId ?? raw.legacy?.quoted_status_id_str ?? void 0,
      quotes: raw.legacy?.quote_count ?? 0,
      replies: raw.legacy?.reply_count ?? 0,
      retweets: raw.legacy?.retweet_count ?? 0,
      retweetedStatus,
      retweetedStatusId: raw.legacy?.retweeted_status_id_str ?? void 0,
      text: raw.text ?? raw.legacy?.full_text ?? void 0,
      thread: raw.thread || [],
      timeParsed: raw.timeParsed ? new Date(raw.timeParsed) : raw.legacy?.created_at ? new Date(raw.legacy?.created_at) : void 0,
      timestamp: raw.timestamp ?? (raw.legacy?.created_at ? new Date(raw.legacy.created_at).getTime() / 1e3 : void 0),
      urls: raw.urls ?? raw.legacy?.entities?.urls ?? [],
      userId: raw.userId ?? raw.legacy?.user_id_str ?? void 0,
      username: raw.username ?? raw.core?.user_results?.result?.legacy?.screen_name ?? void 0,
      videos: raw.videos ?? raw.legacy?.entities?.media?.filter((media) => media.type === "video") ?? [],
      views: raw.views?.count ? Number(raw.views.count) : 0,
      sensitiveContent: raw.sensitiveContent
    };
    return t;
  }
  async init() {
    await this.runtime.ensureAgentExists(this.runtime.character);
    const username = this.state?.TWITTER_USERNAME || this.runtime.getSetting("TWITTER_USERNAME");
    const password = this.state?.TWITTER_PASSWORD || this.runtime.getSetting("TWITTER_PASSWORD");
    const email = this.state?.TWITTER_EMAIL || this.runtime.getSetting("TWITTER_EMAIL");
    const twitter2faSecret = this.state?.TWITTER_2FA_SECRET || this.runtime.getSetting("TWITTER_2FA_SECRET");
    if (!username || !password || !email) {
      const missing = [];
      if (!username) missing.push("TWITTER_USERNAME");
      if (!password) missing.push("TWITTER_PASSWORD");
      if (!email) missing.push("TWITTER_EMAIL");
      throw new Error(`Missing required Twitter credentials: ${missing.join(", ")}`);
    }
    const maxRetries = 3;
    let retryCount = 0;
    let lastError = null;
    while (retryCount < maxRetries) {
      try {
        const authToken = this.state?.TWITTER_COOKIES_AUTH_TOKEN || this.runtime.getSetting("TWITTER_COOKIES_AUTH_TOKEN");
        const ct0 = this.state?.TWITTER_COOKIES_CT0 || this.runtime.getSetting("TWITTER_COOKIES_CT0");
        const guestId = this.state?.TWITTER_COOKIES_GUEST_ID || this.runtime.getSetting("TWITTER_COOKIES_GUEST_ID");
        const createTwitterCookies = (authToken2, ct02, guestId2) => authToken2 && ct02 && guestId2 ? [
          { key: "auth_token", value: authToken2, domain: ".twitter.com" },
          { key: "ct0", value: ct02, domain: ".twitter.com" },
          { key: "guest_id", value: guestId2, domain: ".twitter.com" }
        ] : null;
        const cachedCookies = await this.getCachedCookies(username) || createTwitterCookies(authToken, ct0, guestId);
        if (cachedCookies) {
          logger6.info("Using cached cookies");
          await this.setCookiesFromArray(cachedCookies);
        }
        logger6.log("Waiting for Twitter login");
        if (await this.twitterClient.isLoggedIn()) {
          logger6.info("Successfully logged in.");
          break;
        }
        await this.twitterClient.login(username, password, email, twitter2faSecret);
        if (await this.twitterClient.isLoggedIn()) {
          logger6.info("Successfully logged in.");
          logger6.info("Caching cookies");
          await this.cacheCookies(username, await this.twitterClient.getCookies());
          break;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger6.error(`Login attempt ${retryCount + 1} failed: ${lastError.message}`);
        retryCount++;
        if (retryCount < maxRetries) {
          const delay = 2 ** retryCount * 1e3;
          logger6.info(`Retrying in ${delay / 1e3} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    if (retryCount >= maxRetries) {
      throw new Error(
        `Twitter login failed after ${maxRetries} attempts. Last error: ${lastError?.message}`
      );
    }
    this.profile = await this.fetchProfile(username);
    if (this.profile) {
      logger6.log("Twitter user ID:", this.profile.id);
      logger6.log("Twitter loaded:", JSON.stringify(this.profile, null, 10));
      this.profile = {
        id: this.profile.id,
        username: this.profile.username,
        screenName: this.profile.screenName,
        bio: this.profile.bio,
        nicknames: this.profile.nicknames
      };
    } else {
      throw new Error("Failed to load profile");
    }
    await this.loadLatestCheckedTweetId();
    await this.populateTimeline();
  }
  async fetchOwnPosts(count) {
    logger6.debug("fetching own posts");
    const homeTimeline = await this.twitterClient.getUserTweets(this.profile.id, count);
    return homeTimeline.tweets.map((t) => this.parseTweet(t));
  }
  /**
   * Fetch timeline for twitter account, optionally only from followed accounts
   */
  async fetchHomeTimeline(count, following) {
    logger6.debug("fetching home timeline");
    const homeTimeline = following ? await this.twitterClient.fetchFollowingTimeline(count, []) : await this.twitterClient.fetchHomeTimeline(count, []);
    const processedTimeline = homeTimeline.filter((t) => t.__typename !== "TweetWithVisibilityResults").map((tweet) => this.parseTweet(tweet));
    return processedTimeline;
  }
  async fetchSearchTweets(query, maxTweets, searchMode, cursor) {
    try {
      const timeoutPromise = new Promise(
        (resolve) => setTimeout(() => resolve({ tweets: [] }), 15e3)
      );
      try {
        const result = await this.requestQueue.add(
          async () => await Promise.race([
            this.twitterClient.fetchSearchTweets(query, maxTweets, searchMode, cursor),
            timeoutPromise
          ])
        );
        return result ?? { tweets: [] };
      } catch (error) {
        logger6.error("Error fetching search tweets:", error);
        return { tweets: [] };
      }
    } catch (error) {
      logger6.error("Error fetching search tweets:", error);
      return { tweets: [] };
    }
  }
  async populateTimeline() {
    logger6.debug("populating timeline...");
    const cachedTimeline = await this.getCachedTimeline();
    if (cachedTimeline) {
      const existingMemories2 = await this.runtime.getMemoriesByRoomIds({
        tableName: "messages",
        roomIds: cachedTimeline.map(
          (tweet) => createUniqueUuid4(this.runtime, tweet.conversationId)
        )
      });
      const existingMemoryIds2 = new Set(existingMemories2.map((memory) => memory.id.toString()));
      const someCachedTweetsExist = cachedTimeline.some(
        (tweet) => existingMemoryIds2.has(createUniqueUuid4(this.runtime, tweet.id))
      );
      if (someCachedTweetsExist) {
        const tweetsToSave2 = cachedTimeline.filter(
          (tweet) => tweet.userId !== this.profile.id && !existingMemoryIds2.has(createUniqueUuid4(this.runtime, tweet.id))
        );
        for (const tweet of tweetsToSave2) {
          logger6.log("Saving Tweet", tweet.id);
          if (tweet.userId === this.profile.id) {
            continue;
          }
          const worldId = createUniqueUuid4(this.runtime, tweet.userId);
          await this.runtime.ensureWorldExists({
            id: worldId,
            name: `${tweet.username}'s Twitter`,
            agentId: this.runtime.agentId,
            serverId: tweet.userId,
            metadata: {
              ownership: { ownerId: tweet.userId },
              twitter: {
                username: tweet.username,
                id: tweet.userId
              }
            }
          });
          const roomId = createUniqueUuid4(this.runtime, tweet.conversationId);
          await this.runtime.ensureRoomExists({
            id: roomId,
            name: `${tweet.username}'s Thread`,
            source: "twitter",
            type: ChannelType4.FEED,
            channelId: tweet.conversationId,
            serverId: tweet.userId,
            worldId
          });
          const entityId = tweet.userId === this.profile.id ? this.runtime.agentId : createUniqueUuid4(this.runtime, tweet.userId);
          await this.runtime.ensureConnection({
            entityId,
            roomId,
            userName: tweet.username,
            name: tweet.name,
            source: "twitter",
            type: ChannelType4.FEED,
            worldId
          });
          const content = {
            text: tweet.text,
            url: tweet.permanentUrl,
            source: "twitter",
            inReplyTo: tweet.inReplyToStatusId ? createUniqueUuid4(this.runtime, tweet.inReplyToStatusId) : void 0
          };
          await this.runtime.createMemory(
            {
              id: createUniqueUuid4(this.runtime, tweet.id),
              entityId,
              content,
              agentId: this.runtime.agentId,
              roomId,
              createdAt: tweet.timestamp * 1e3
            },
            "messages"
          );
          await this.cacheTweet(tweet);
        }
        logger6.log(`Populated ${tweetsToSave2.length} missing tweets from the cache.`);
        return;
      }
    }
    const timeline = await this.fetchHomeTimeline(cachedTimeline ? 10 : 50);
    const username = this.runtime.getSetting("TWITTER_USERNAME");
    const mentionsAndInteractions = await this.fetchSearchTweets(
      `@${username}`,
      20,
      1 /* Latest */
    );
    const allTweets = [...timeline, ...mentionsAndInteractions.tweets];
    const tweetIdsToCheck = /* @__PURE__ */ new Set();
    const roomIds = /* @__PURE__ */ new Set();
    for (const tweet of allTweets) {
      tweetIdsToCheck.add(tweet.id);
      roomIds.add(createUniqueUuid4(this.runtime, tweet.conversationId));
    }
    const existingMemories = await this.runtime.getMemoriesByRoomIds({
      tableName: "messages",
      roomIds: Array.from(roomIds)
    });
    const existingMemoryIds = new Set(existingMemories.map((memory) => memory.id));
    const tweetsToSave = allTweets.filter(
      (tweet) => tweet.userId !== this.profile.id && !existingMemoryIds.has(createUniqueUuid4(this.runtime, tweet.id))
    );
    logger6.debug({
      processingTweets: tweetsToSave.map((tweet) => tweet.id).join(",")
    });
    for (const tweet of tweetsToSave) {
      logger6.log("Saving Tweet", tweet.id);
      if (tweet.userId === this.profile.id) {
        continue;
      }
      const worldId = createUniqueUuid4(this.runtime, tweet.userId);
      await this.runtime.ensureWorldExists({
        id: worldId,
        name: `${tweet.username}'s Twitter`,
        agentId: this.runtime.agentId,
        serverId: tweet.userId,
        metadata: {
          ownership: { ownerId: tweet.userId },
          twitter: {
            username: tweet.username,
            id: tweet.userId
          }
        }
      });
      const roomId = createUniqueUuid4(this.runtime, tweet.conversationId);
      await this.runtime.ensureRoomExists({
        id: roomId,
        name: `${tweet.username}'s Thread`,
        source: "twitter",
        type: ChannelType4.FEED,
        channelId: tweet.conversationId,
        serverId: tweet.userId,
        worldId
      });
      const entityId = tweet.userId === this.profile.id ? this.runtime.agentId : createUniqueUuid4(this.runtime, tweet.userId);
      await this.runtime.ensureConnection({
        entityId,
        roomId,
        userName: tweet.username,
        name: tweet.name,
        source: "twitter",
        type: ChannelType4.FEED,
        worldId
      });
      const content = {
        text: tweet.text,
        url: tweet.permanentUrl,
        source: "twitter",
        inReplyTo: tweet.inReplyToStatusId ? createUniqueUuid4(this.runtime, tweet.inReplyToStatusId) : void 0
      };
      await this.runtime.createMemory(
        {
          id: createUniqueUuid4(this.runtime, tweet.id),
          entityId,
          content,
          agentId: this.runtime.agentId,
          roomId,
          createdAt: tweet.timestamp * 1e3
        },
        "messages"
      );
      await this.cacheTweet(tweet);
    }
    await this.cacheTimeline(timeline);
    await this.cacheMentions(mentionsAndInteractions.tweets);
  }
  async setCookiesFromArray(cookiesArray) {
    const cookieStrings = cookiesArray.map(
      (cookie) => `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}; ${cookie.secure ? "Secure" : ""}; ${cookie.httpOnly ? "HttpOnly" : ""}; SameSite=${cookie.sameSite || "Lax"}`
    );
    await this.twitterClient.setCookies(cookieStrings);
  }
  async saveRequestMessage(message, state) {
    if (message.content.text) {
      const recentMessage = await this.runtime.getMemories({
        tableName: "messages",
        roomId: message.roomId,
        count: 1,
        unique: false
      });
      if (recentMessage.length > 0 && recentMessage[0].content === message.content) {
        logger6.debug("Message already saved", recentMessage[0].id);
      } else {
        await this.runtime.createMemory(message, "messages");
      }
      await this.runtime.evaluate(message, {
        ...state,
        twitterClient: this.twitterClient
      });
    }
  }
  async loadLatestCheckedTweetId() {
    const latestCheckedTweetId = await this.runtime.getCache(
      `twitter/${this.profile.username}/latest_checked_tweet_id`
    );
    if (latestCheckedTweetId) {
      this.lastCheckedTweetId = BigInt(latestCheckedTweetId);
    }
  }
  async cacheLatestCheckedTweetId() {
    if (this.lastCheckedTweetId) {
      await this.runtime.setCache(
        `twitter/${this.profile.username}/latest_checked_tweet_id`,
        this.lastCheckedTweetId.toString()
      );
    }
  }
  async getCachedTimeline() {
    const cached = await this.runtime.getCache(
      `twitter/${this.profile.username}/timeline`
    );
    if (!cached) {
      return void 0;
    }
    return cached;
  }
  async cacheTimeline(timeline) {
    await this.runtime.setCache(`twitter/${this.profile.username}/timeline`, timeline);
  }
  async cacheMentions(mentions) {
    await this.runtime.setCache(`twitter/${this.profile.username}/mentions`, mentions);
  }
  async getCachedCookies(username) {
    const cached = await this.runtime.getCache(`twitter/${username}/cookies`);
    if (!cached) {
      return void 0;
    }
    return cached;
  }
  async cacheCookies(username, cookies) {
    await this.runtime.setCache(`twitter/${username}/cookies`, cookies);
  }
  async fetchProfile(username) {
    try {
      const profile = await this.requestQueue.add(async () => {
        const profile2 = await this.twitterClient.getProfile(username);
        return {
          id: profile2.userId,
          username,
          screenName: profile2.name || this.runtime.character.name,
          bio: profile2.biography || typeof this.runtime.character.bio === "string" ? this.runtime.character.bio : this.runtime.character.bio.length > 0 ? this.runtime.character.bio[0] : "",
          nicknames: this.profile?.nicknames || []
        };
      });
      return profile;
    } catch (error) {
      console.error("Error fetching Twitter profile:", error);
      throw error;
    }
  }
  /**
   * Fetches recent interactions (likes, retweets, quotes) for the authenticated user's tweets
   */
  async fetchInteractions() {
    try {
      const username = this.profile.username;
      const mentionsResponse = await this.requestQueue.add(
        () => this.twitterClient.fetchSearchTweets(`@${username}`, 100, 1 /* Latest */)
      );
      return mentionsResponse.tweets.map((tweet) => this.formatTweetToInteraction(tweet));
    } catch (error) {
      logger6.error("Error fetching Twitter interactions:", error);
      return [];
    }
  }
  formatTweetToInteraction(tweet) {
    if (!tweet) return null;
    const isQuote = tweet.isQuoted;
    const isRetweet = !!tweet.retweetedStatus;
    const type = isQuote ? "quote" : isRetweet ? "retweet" : "like";
    return {
      id: tweet.id,
      type,
      userId: tweet.userId,
      username: tweet.username,
      name: tweet.name || tweet.username,
      targetTweetId: tweet.inReplyToStatusId || tweet.quotedStatusId,
      targetTweet: tweet.quotedStatus || tweet,
      quoteTweet: isQuote ? tweet : void 0,
      retweetId: tweet.retweetedStatus?.id
    };
  }
};
_ClientBase._twitterClients = {};
var ClientBase = _ClientBase;

// src/constants.ts
var TWITTER_SERVICE_NAME = "twitter";

// src/interactions.ts
import {
  ChannelType as ChannelType5,
  EventType as EventType2,
  ModelType as ModelType4,
  createUniqueUuid as createUniqueUuid5,
  logger as logger7
} from "@elizaos/core";
var convertToCoreTweet = (tweet) => ({
  id: tweet.id,
  text: tweet.text,
  conversationId: tweet.conversationId,
  timestamp: tweet.timestamp,
  userId: tweet.userId,
  username: tweet.username,
  name: tweet.name,
  inReplyToStatusId: tweet.inReplyToStatusId,
  permanentUrl: tweet.permanentUrl,
  photos: tweet.photos,
  hashtags: tweet.hashtags,
  mentions: tweet.mentions.map((mention) => mention.username),
  urls: tweet.urls,
  videos: tweet.videos,
  thread: tweet.thread
});
var convertToCoreTweets = (tweets) => tweets.map(convertToCoreTweet);
var TwitterInteractionClient = class {
  /**
   * Constructor for setting up a new instance with the provided client, runtime, and state.
   * @param {ClientBase} client - The client being used for communication.
   * @param {IAgentRuntime} runtime - The runtime environment for the agent.
   * @param {any} state - The initial state of the agent.
   */
  constructor(client, runtime, state) {
    this.client = client;
    this.runtime = runtime;
    this.state = state;
    this.isDryRun = this.state?.TWITTER_DRY_RUN || this.runtime.getSetting("TWITTER_DRY_RUN");
  }
  /**
   * Asynchronously starts the process of handling Twitter interactions on a loop.
   * Uses an interval based on the 'TWITTER_POLL_INTERVAL' setting, or defaults to 2 minutes if not set.
   */
  async start() {
    const handleTwitterInteractionsLoop = () => {
      const interactionInterval = (this.state?.TWITTER_POLL_INTERVAL || this.runtime.getSetting("TWITTER_POLL_INTERVAL") || 120) * 1e3;
      this.handleTwitterInteractions();
      setTimeout(handleTwitterInteractionsLoop, interactionInterval);
    };
    handleTwitterInteractionsLoop();
  }
  /**
   * Asynchronously handles Twitter interactions by checking for mentions, processing tweets, and updating the last checked tweet ID.
   */
  async handleTwitterInteractions() {
    logger7.log("Checking Twitter interactions");
    const twitterUsername = this.client.profile?.username;
    try {
      const cursorKey = `twitter/${twitterUsername}/mention_cursor`;
      const cachedCursor = await this.runtime.getCache(cursorKey);
      const searchResult = await this.client.fetchSearchTweets(
        `@${twitterUsername}`,
        20,
        1 /* Latest */,
        cachedCursor
      );
      const mentionCandidates = searchResult.tweets;
      if (mentionCandidates.length > 0 && searchResult.previous) {
        await this.runtime.setCache(cursorKey, searchResult.previous);
      } else if (!searchResult.previous && !searchResult.next) {
        await this.runtime.setCache(cursorKey, null);
      }
      await this.processMentionTweets(mentionCandidates);
      await this.client.cacheLatestCheckedTweetId();
      logger7.log("Finished checking Twitter interactions");
    } catch (error) {
      logger7.error("Error handling Twitter interactions:", error);
    }
  }
  /**
   * Processes all incoming tweets that mention the bot.
   * For each new tweet:
   *  - Ensures world, room, and connection exist
   *  - Saves the tweet as memory
   *  - Emits thread-related events (THREAD_CREATED / THREAD_UPDATED)
   *  - Delegates tweet content to `handleTweet` for reply generation
   *
   * Note: MENTION_RECEIVED is currently disabled (see TODO below)
   */
  async processMentionTweets(mentionCandidates) {
    logger7.log("Completed checking mentioned tweets:", mentionCandidates.length);
    let uniqueTweetCandidates = [...mentionCandidates];
    uniqueTweetCandidates = uniqueTweetCandidates.sort((a, b) => a.id.localeCompare(b.id)).filter((tweet) => tweet.userId !== this.client.profile.id);
    for (const tweet of uniqueTweetCandidates) {
      if (!this.client.lastCheckedTweetId || BigInt(tweet.id) > this.client.lastCheckedTweetId) {
        const tweetId = createUniqueUuid5(this.runtime, tweet.id);
        const existingResponse = await this.runtime.getMemoryById(tweetId);
        if (existingResponse) {
          logger7.log(`Already responded to tweet ${tweet.id}, skipping`);
          continue;
        }
        logger7.log("New Tweet found", tweet.permanentUrl);
        const entityId = createUniqueUuid5(
          this.runtime,
          tweet.userId === this.client.profile.id ? this.runtime.agentId : tweet.userId
        );
        const worldId = createUniqueUuid5(this.runtime, tweet.userId);
        const roomId = createUniqueUuid5(this.runtime, tweet.conversationId);
        await this.runtime.ensureWorldExists({
          id: worldId,
          name: `${tweet.name}'s Twitter`,
          agentId: this.runtime.agentId,
          serverId: tweet.userId,
          metadata: {
            ownership: { ownerId: tweet.userId },
            twitter: {
              username: tweet.username,
              id: tweet.userId,
              name: tweet.name
            }
          }
        });
        await this.runtime.ensureConnection({
          entityId,
          roomId,
          userName: tweet.username,
          name: tweet.name,
          source: "twitter",
          type: ChannelType5.GROUP,
          channelId: tweet.conversationId,
          serverId: tweet.userId,
          worldId
        });
        await this.runtime.ensureRoomExists({
          id: roomId,
          name: `Conversation with ${tweet.name}`,
          source: "twitter",
          type: ChannelType5.GROUP,
          channelId: tweet.conversationId,
          serverId: tweet.userId,
          worldId
        });
        const memory = {
          id: tweetId,
          agentId: this.runtime.agentId,
          content: {
            text: tweet.text,
            url: tweet.permanentUrl,
            imageUrls: tweet.photos?.map((photo) => photo.url) || [],
            inReplyTo: tweet.inReplyToStatusId ? createUniqueUuid5(this.runtime, tweet.inReplyToStatusId) : void 0,
            source: "twitter",
            channelType: ChannelType5.GROUP,
            tweet
          },
          entityId,
          roomId,
          createdAt: tweet.timestamp * 1e3
        };
        await this.runtime.createMemory(memory, "messages");
        if (tweet.thread.length > 1) {
          const threadPayload = {
            runtime: this.runtime,
            tweets: convertToCoreTweets(tweet.thread),
            user: {
              id: tweet.userId,
              username: tweet.username,
              name: tweet.name
            },
            source: "twitter"
          };
          if (tweet.thread[tweet.thread.length - 1].id === tweet.id) {
            this.runtime.emitEvent("TWITTER_THREAD_UPDATED" /* THREAD_UPDATED */, {
              ...threadPayload,
              newTweet: convertToCoreTweet(tweet)
            });
          } else if (tweet.thread[0].id === tweet.id) {
            this.runtime.emitEvent("TWITTER_THREAD_CREATED" /* THREAD_CREATED */, threadPayload);
          }
        }
        await this.handleTweet({
          tweet,
          message: memory,
          thread: tweet.thread
        });
        this.client.lastCheckedTweetId = BigInt(tweet.id);
      }
    }
  }
  /**
   * Handles Twitter interactions such as likes, retweets, and quotes.
   * For each interaction:
   *  - Creates a memory object
   *  - Emits platform-specific events (LIKE_RECEIVED, RETWEET_RECEIVED, QUOTE_RECEIVED)
   *  - Emits a generic REACTION_RECEIVED event with metadata
   */
  async handleInteraction(interaction) {
    if (interaction?.targetTweet?.conversationId) {
      const memory = this.createMemoryObject(
        interaction.type,
        `${interaction.id}-${interaction.type}`,
        interaction.userId,
        interaction.targetTweet.conversationId
      );
      await this.runtime.createMemory(memory, "messages");
      const reactionMessage = {
        id: createUniqueUuid5(this.runtime, interaction.targetTweetId),
        content: {
          text: interaction.targetTweet.text,
          source: "twitter"
        },
        entityId: createUniqueUuid5(this.runtime, interaction.targetTweet.userId),
        roomId: createUniqueUuid5(this.runtime, interaction.targetTweet.conversationId),
        agentId: this.runtime.agentId
      };
      const basePayload = {
        runtime: this.runtime,
        user: {
          id: interaction.userId,
          username: interaction.username,
          name: interaction.name
        },
        source: "twitter"
      };
      switch (interaction.type) {
        case "like": {
          const likePayload = {
            ...basePayload,
            tweet: interaction.targetTweet
          };
          this.runtime.emitEvent("TWITTER_LIKE_RECEIVED" /* LIKE_RECEIVED */, likePayload);
          this.runtime.emitEvent(EventType2.REACTION_RECEIVED, {
            ...basePayload,
            reaction: {
              type: "like",
              entityId: createUniqueUuid5(this.runtime, interaction.userId)
            },
            message: reactionMessage,
            callback: async () => {
              return [];
            }
          });
          break;
        }
        case "retweet": {
          const retweetPayload = {
            ...basePayload,
            tweet: interaction.targetTweet,
            retweetId: interaction.retweetId
          };
          this.runtime.emitEvent("TWITTER_RETWEET_RECEIVED" /* RETWEET_RECEIVED */, retweetPayload);
          this.runtime.emitEvent(EventType2.REACTION_RECEIVED, {
            ...basePayload,
            reaction: {
              type: "retweet",
              entityId: createUniqueUuid5(this.runtime, interaction.userId)
            },
            message: reactionMessage,
            callback: async () => {
              return [];
            }
          });
          break;
        }
        case "quote": {
          const quotePayload = {
            ...basePayload,
            message: reactionMessage,
            quotedTweet: interaction.targetTweet,
            quoteTweet: interaction.quoteTweet || interaction.targetTweet,
            callback: async () => [],
            reaction: {
              type: "quote",
              entityId: createUniqueUuid5(this.runtime, interaction.userId)
            }
          };
          this.runtime.emitEvent("TWITTER_QUOTE_RECEIVED" /* QUOTE_RECEIVED */, quotePayload);
          this.runtime.emitEvent(EventType2.REACTION_RECEIVED, {
            ...basePayload,
            reaction: {
              type: "quote",
              entityId: createUniqueUuid5(this.runtime, interaction.userId)
            },
            message: reactionMessage,
            callback: async () => {
              return [];
            }
          });
          break;
        }
      }
    }
  }
  /**
   * Handles a tweet by processing its content, formatting it, generating image descriptions,
   * saving the tweet if it doesn't already exist, determining if a response should be sent,
   * composing a response prompt, generating a response based on the prompt, handling the response
   * tweet, and saving information about the response.
   *
   * @param {object} params - The parameters object containing the tweet, message, and thread.
   * @param {Tweet} params.tweet - The tweet object to handle.
   * @param {Memory} params.message - The memory object associated with the tweet.
   * @param {Tweet[]} params.thread - The array of tweets in the thread.
   * @returns {object} - An object containing the text of the response and any relevant actions.
   */
  async handleTweet({
    tweet,
    message,
    thread
  }) {
    if (!message.content.text) {
      logger7.log("Skipping Tweet with no text", tweet.id);
      return { text: "", actions: ["IGNORE"] };
    }
    logger7.log("Processing Tweet: ", tweet.id);
    const formatTweet = (tweet2) => {
      return `  ID: ${tweet2.id}
  From: ${tweet2.name} (@${tweet2.username})
  Text: ${tweet2.text}`;
    };
    const currentPost = formatTweet(tweet);
    const formattedConversation = thread.map(
      (tweet2) => `@${tweet2.username} (${new Date(tweet2.timestamp * 1e3).toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        day: "numeric"
      })}):
        ${tweet2.text}`
    ).join("\n\n");
    const imageDescriptionsArray = [];
    try {
      for (const photo of tweet.photos) {
        const description = await this.runtime.useModel(ModelType4.IMAGE_DESCRIPTION, photo.url);
        imageDescriptionsArray.push(description);
      }
    } catch (error) {
      logger7.error("Error Occured during describing image: ", error);
    }
    const callback = async (response, tweetId) => {
      try {
        if (!response.text) {
          logger7.warn("No text content in response, skipping tweet reply");
          return [];
        }
        const tweetToReplyTo = tweetId || tweet.id;
        if (this.isDryRun) {
          logger7.info(`[DRY RUN] Would have replied to ${tweet.username} with: ${response.text}`);
          return [];
        }
        logger7.info(`Replying to tweet ${tweetToReplyTo}`);
        const replyTweetResult = await this.client.requestQueue.add(
          () => this.client.twitterClient.sendTweet(response.text.substring(0, 280), tweetToReplyTo)
        );
        if (!replyTweetResult) {
          throw new Error("Failed to create tweet response");
        }
        const responseBody = await replyTweetResult.json();
        const tweetResult = responseBody?.data?.create_tweet?.tweet_results?.result;
        if (!tweetResult) {
          throw new Error("Failed to get tweet result from response");
        }
        const responseId = createUniqueUuid5(this.runtime, tweetResult.rest_id);
        const responseMemory = {
          id: responseId,
          entityId: this.runtime.agentId,
          agentId: this.runtime.agentId,
          roomId: message.roomId,
          content: {
            ...response,
            inReplyTo: message.id
          },
          createdAt: Date.now()
        };
        await this.runtime.createMemory(responseMemory, "messages");
        return [responseMemory];
      } catch (error) {
        logger7.error("Error replying to tweet:", error);
        return [];
      }
    };
    this.runtime.emitEvent(EventType2.MESSAGE_RECEIVED, {
      runtime: this.runtime,
      message,
      callback,
      source: "twitter"
    });
    return { text: "", actions: ["RESPOND"] };
  }
  /**
   * Build a conversation thread based on a given tweet.
   *
   * @param {Tweet} tweet - The tweet to start the thread from.
   * @param {number} [maxReplies=10] - The maximum number of replies to include in the thread.
   * @returns {Promise<Tweet[]>} The conversation thread as an array of tweets.
   */
  async buildConversationThread(tweet, maxReplies = 10) {
    const thread = [];
    const visited = /* @__PURE__ */ new Set();
    async function processThread(currentTweet, depth = 0) {
      logger7.log("Processing tweet:", {
        id: currentTweet.id,
        inReplyToStatusId: currentTweet.inReplyToStatusId,
        depth
      });
      if (!currentTweet) {
        logger7.log("No current tweet found for thread building");
        return;
      }
      if (depth >= maxReplies) {
        logger7.log("Reached maximum reply depth", depth);
        return;
      }
      const memory = await this.runtime.getMemoryById(
        createUniqueUuid5(this.runtime, currentTweet.id)
      );
      if (!memory) {
        const roomId = createUniqueUuid5(this.runtime, tweet.conversationId);
        const entityId = createUniqueUuid5(this.runtime, currentTweet.userId);
        await this.runtime.ensureConnection({
          entityId,
          roomId,
          userName: currentTweet.username,
          name: currentTweet.name,
          source: "twitter",
          type: ChannelType5.GROUP
        });
        this.runtime.createMemory(
          {
            id: createUniqueUuid5(this.runtime, currentTweet.id),
            agentId: this.runtime.agentId,
            content: {
              text: currentTweet.text,
              source: "twitter",
              url: currentTweet.permanentUrl,
              imageUrls: currentTweet.photos?.map((photo) => photo.url) || [],
              inReplyTo: currentTweet.inReplyToStatusId ? createUniqueUuid5(this.runtime, currentTweet.inReplyToStatusId) : void 0
            },
            createdAt: currentTweet.timestamp * 1e3,
            roomId,
            entityId: currentTweet.userId === this.twitterUserId ? this.runtime.agentId : createUniqueUuid5(this.runtime, currentTweet.userId)
          },
          "messages"
        );
      }
      if (visited.has(currentTweet.id)) {
        logger7.log("Already visited tweet:", currentTweet.id);
        return;
      }
      visited.add(currentTweet.id);
      thread.unshift(currentTweet);
      if (currentTweet.inReplyToStatusId) {
        logger7.log("Fetching parent tweet:", currentTweet.inReplyToStatusId);
        try {
          const parentTweet = await this.twitterClient.getTweet(currentTweet.inReplyToStatusId);
          if (parentTweet) {
            logger7.log("Found parent tweet:", {
              id: parentTweet.id,
              text: parentTweet.text?.slice(0, 50)
            });
            await processThread(parentTweet, depth + 1);
          } else {
            logger7.log("No parent tweet found for:", currentTweet.inReplyToStatusId);
          }
        } catch (error) {
          logger7.log("Error fetching parent tweet:", {
            tweetId: currentTweet.inReplyToStatusId,
            error
          });
        }
      } else {
        logger7.log("Reached end of reply chain at:", currentTweet.id);
      }
    }
    await processThread.bind(this)(tweet, 0);
    return thread;
  }
  createMemoryObject(type, id, userId, roomId) {
    return {
      id: createUniqueUuid5(this.runtime, id),
      agentId: this.runtime.agentId,
      entityId: createUniqueUuid5(this.runtime, userId),
      roomId: createUniqueUuid5(this.runtime, roomId),
      content: {
        type,
        source: "twitter"
      },
      createdAt: Date.now()
    };
  }
};

// src/post.ts
import {
  ChannelType as ChannelType6,
  EventType as EventType3,
  createUniqueUuid as createUniqueUuid6,
  logger as logger8,
  parseBooleanFromText,
  truncateToCompleteSentence
} from "@elizaos/core";
var TwitterPostClient = class {
  /**
   * Constructor for initializing a new Twitter client with the provided client, runtime, and state
   * @param {ClientBase} client - The client used for interacting with Twitter API
   * @param {IAgentRuntime} runtime - The runtime environment for the agent
   * @param {any} state - The state object containing configuration settings
   */
  constructor(client, runtime, state) {
    this.client = client;
    this.state = state;
    this.runtime = runtime;
    this.twitterUsername = state?.TWITTER_USERNAME || this.runtime.getSetting("TWITTER_USERNAME");
    this.isDryRun = this.state?.TWITTER_DRY_RUN || this.runtime.getSetting("TWITTER_DRY_RUN");
    logger8.log("Twitter Client Configuration:");
    logger8.log(`- Username: ${this.twitterUsername}`);
    logger8.log(`- Dry Run Mode: ${this.isDryRun ? "Enabled" : "Disabled"}`);
    this.state.isTwitterEnabled = parseBooleanFromText(
      String(
        this.state?.TWITTER_ENABLE_POST_GENERATION || this.runtime.getSetting("TWITTER_ENABLE_POST_GENERATION") || ""
      )
    );
    logger8.log(`- Auto-post: ${this.state.isTwitterEnabled ? "enabled" : "disabled"}`);
    logger8.log(
      `- Post Interval: ${this.state?.TWITTER_POST_INTERVAL_MIN || this.runtime.getSetting("TWITTER_POST_INTERVAL_MIN")}-${this.state?.TWITTER_POST_INTERVAL_MAX || this.runtime.getSetting("TWITTER_POST_INTERVAL_MAX")} minutes`
    );
    logger8.log(
      `- Post Immediately: ${this.state?.TWITTER_POST_IMMEDIATELY || this.runtime.getSetting("TWITTER_POST_IMMEDIATELY") ? "enabled" : "disabled"}`
    );
    if (this.isDryRun) {
      logger8.log("Twitter client initialized in dry run mode - no actual tweets should be posted");
    }
  }
  /**
   * Starts the Twitter post client, setting up a loop to periodically generate new tweets.
   */
  async start() {
    logger8.log("Starting Twitter post client...");
    const tweetGeneration = this.state.isTwitterEnabled;
    if (tweetGeneration === false) {
      logger8.log("Tweet generation is disabled");
      return;
    }
    const generateNewTweetLoop = async () => {
      const interval = (this.state?.TWITTER_POST_INTERVAL || this.runtime.getSetting("TWITTER_POST_INTERVAL") || 30) * 60 * 1e3;
      this.generateNewTweet();
      setTimeout(generateNewTweetLoop, interval);
    };
    setTimeout(generateNewTweetLoop, 60 * 1e3);
    if (this.runtime.getSetting("TWITTER_POST_IMMEDIATELY")) {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      this.generateNewTweet();
    }
  }
  /**
   * Creates a Tweet object based on the tweet result, client information, and Twitter username.
   *
   * @param {any} tweetResult - The result object from the Twitter API representing a tweet.
   * @param {any} client - The client object containing profile information.
   * @param {string} twitterUsername - The Twitter username of the user.
   * @returns {Tweet} A Tweet object with specific properties extracted from the tweet result and client information.
   */
  createTweetObject(tweetResult, client, twitterUsername) {
    return {
      id: tweetResult.rest_id,
      name: client.profile.screenName,
      username: client.profile.username,
      text: tweetResult.legacy.full_text,
      conversationId: tweetResult.legacy.conversation_id_str,
      createdAt: tweetResult.legacy.created_at,
      timestamp: new Date(tweetResult.legacy.created_at).getTime(),
      userId: client.profile.id,
      inReplyToStatusId: tweetResult.legacy.in_reply_to_status_id_str,
      permanentUrl: `https://twitter.com/${twitterUsername}/status/${tweetResult.rest_id}`,
      hashtags: [],
      mentions: [],
      photos: [],
      thread: [],
      urls: [],
      videos: []
    };
  }
  /**
   * Processes and caches a tweet.
   *
   * @param {IAgentRuntime} runtime - The agent runtime.
   * @param {ClientBase} client - The client object.
   * @param {Tweet} tweet - The tweet to be processed and cached.
   * @param {UUID} roomId - The ID of the room where the tweet will be stored.
   * @param {string} rawTweetContent - The raw content of the tweet.
   */
  async processAndCacheTweet(runtime, client, tweet, roomId, rawTweetContent) {
    await runtime.setCache(`twitter/${client.profile.username}/lastPost`, {
      id: tweet.id,
      timestamp: Date.now()
    });
    await client.cacheTweet(tweet);
    logger8.log(`Tweet posted:
 ${tweet.permanentUrl}`);
    await runtime.ensureRoomExists({
      id: roomId,
      name: "Twitter Feed",
      source: "twitter",
      type: ChannelType6.FEED
    });
    await runtime.ensureParticipantInRoom(runtime.agentId, roomId);
    await runtime.createMemory(
      {
        id: createUniqueUuid6(this.runtime, tweet.id),
        entityId: runtime.agentId,
        agentId: runtime.agentId,
        content: {
          text: rawTweetContent.trim(),
          url: tweet.permanentUrl,
          source: "twitter"
        },
        roomId,
        createdAt: tweet.timestamp
      },
      "messages"
    );
  }
  /**
   * Handles sending a note tweet with optional media data.
   *
   * @param {ClientBase} client - The client object used for sending the note tweet.
   * @param {string} content - The content of the note tweet.
   * @param {string} [tweetId] - Optional Tweet ID to reply to.
   * @param {MediaData[]} [mediaData] - Optional media data to attach to the note tweet.
   * @returns {Promise<Object>} - The result of the note tweet operation.
   * @throws {Error} - If the note tweet operation fails.
   */
  async handleNoteTweet(client, content, tweetId, mediaData) {
    try {
      const noteTweetResult = await client.requestQueue.add(
        async () => await client.twitterClient.sendNoteTweet(content, tweetId, mediaData)
      );
      if (noteTweetResult.errors && noteTweetResult.errors.length > 0) {
        const truncateContent = truncateToCompleteSentence(content, 280 - 1);
        return await this.sendStandardTweet(client, truncateContent, tweetId);
      }
      return noteTweetResult.data.notetweet_create.tweet_results.result;
    } catch (error) {
      throw new Error(`Note Tweet failed: ${error}`);
    }
  }
  /**
   * Asynchronously sends a standard tweet using the provided Twitter client.
   *
   * @param {ClientBase} client - The client used to make the request.
   * @param {string} content - The content of the tweet.
   * @param {string} [tweetId] - Optional tweet ID to reply to.
   * @param {MediaData[]} [mediaData] - Optional array of media data to attach to the tweet.
   * @returns {Promise<string>} The result of sending the tweet.
   */
  async sendStandardTweet(client, content, tweetId, mediaData) {
    try {
      const standardTweetResult = await client.requestQueue.add(
        async () => await client.twitterClient.sendTweet(content, tweetId, mediaData)
      );
      const body = await standardTweetResult.json();
      if (!body?.data?.create_tweet?.tweet_results?.result) {
        logger8.error("Error sending tweet; Bad response:", body);
        return;
      }
      return body.data.create_tweet.tweet_results.result;
    } catch (error) {
      logger8.error("Error sending standard Tweet:", error);
      throw error;
    }
  }
  /**
   * Posts a new tweet with the provided tweet content and optional media data.
   *
   * @param {IAgentRuntime} runtime - The runtime environment for the agent.
   * @param {ClientBase} client - The Twitter client used to post the tweet.
   * @param {string} tweetTextForPosting - The text content of the tweet.
   * @param {UUID} roomId - The ID of the room where the tweet will be posted.
   * @param {string} rawTweetContent - The raw content of the tweet.
   * @param {string} twitterUsername - The username associated with the Twitter account.
   * @param {MediaData[]} [mediaData] - Optional media data to be included in the tweet.
   * @returns {Promise<void>} - A Promise that resolves when the tweet is successfully posted.
   */
  async postTweet(runtime, client, tweetTextForPosting, roomId, rawTweetContent, twitterUsername, mediaData) {
    try {
      logger8.log("Posting new tweet:\n");
      let result;
      if (tweetTextForPosting.length > 280 - 1) {
        result = await this.handleNoteTweet(client, tweetTextForPosting, void 0, mediaData);
      } else {
        result = await this.sendStandardTweet(client, tweetTextForPosting, void 0, mediaData);
      }
      const tweet = this.createTweetObject(result, client, twitterUsername);
      await this.processAndCacheTweet(runtime, client, tweet, roomId, rawTweetContent);
    } catch (error) {
      logger8.error("Error sending tweet:");
      throw error;
    }
  }
  /**
   * Handles the creation and posting of a tweet by emitting standardized events.
   * This approach aligns with our platform-independent architecture.
   */
  async generateNewTweet() {
    try {
      const userId = this.client.profile?.id;
      if (!userId) {
        logger8.error("Cannot generate tweet: Twitter profile not available");
        return;
      }
      const worldId = createUniqueUuid6(this.runtime, userId);
      const roomId = createUniqueUuid6(this.runtime, `${userId}-home`);
      const callback = async (content) => {
        try {
          if (this.isDryRun) {
            logger8.info(`[DRY RUN] Would post tweet: ${content.text}`);
            return [];
          }
          if (content.text.includes("Error: Missing")) {
            logger8.error("Error: Missing some context", content);
            return [];
          }
          const result = await this.postToTwitter(content.text, content.mediaData);
          if (result === null) {
            logger8.info("Skipped posting duplicate tweet");
            return [];
          }
          const tweetId = result.rest_id || result.id_str || result.legacy?.id_str;
          if (result) {
            const postedTweetId = createUniqueUuid6(this.runtime, tweetId);
            const postedMemory = {
              id: postedTweetId,
              entityId: this.runtime.agentId,
              agentId: this.runtime.agentId,
              roomId,
              content: {
                ...content,
                source: "twitter",
                channelType: ChannelType6.FEED,
                type: "post",
                metadata: {
                  tweetId,
                  postedAt: Date.now()
                }
              },
              createdAt: Date.now()
            };
            await this.runtime.createMemory(postedMemory, "messages");
            return [postedMemory];
          }
          return [];
        } catch (error) {
          logger8.error("Error posting tweet:", error, content);
          return [];
        }
      };
      this.runtime.emitEvent([EventType3.POST_GENERATED, "TWITTER_POST_GENERATED" /* POST_GENERATED */], {
        runtime: this.runtime,
        callback,
        worldId,
        userId,
        roomId,
        source: "twitter"
      });
    } catch (error) {
      logger8.error("Error generating tweet:", error);
    }
  }
  /**
   * Posts content to Twitter
   * @param {string} text The tweet text to post
   * @param {MediaData[]} mediaData Optional media to attach to the tweet
   * @returns {Promise<any>} The result from the Twitter API
   */
  async postToTwitter(text, mediaData = []) {
    try {
      const lastPost = await this.runtime.getCache(
        `twitter/${this.client.profile?.username}/lastPost`
      );
      if (lastPost) {
        const lastTweet = await this.client.getTweet(lastPost.id);
        if (lastTweet && lastTweet.text === text) {
          logger8.warn("Tweet is a duplicate of the last post. Skipping to avoid duplicate.");
          return null;
        }
      }
      const mediaIds = [];
      if (mediaData && mediaData.length > 0) {
        for (const media of mediaData) {
          try {
            logger8.warn("Media upload not currently supported with the modern Twitter API");
          } catch (error) {
            logger8.error("Error uploading media:", error);
          }
        }
      }
      const result = await this.client.requestQueue.add(
        () => this.client.twitterClient.sendTweet(text.substring(0, 280))
      );
      const body = await result.json();
      if (!body?.data?.create_tweet?.tweet_results?.result) {
        logger8.error("Error sending tweet; Bad response:", body);
        return null;
      }
      return body.data.create_tweet.tweet_results.result;
    } catch (error) {
      logger8.error("Error posting to Twitter:", error);
      throw error;
    }
  }
  async stop() {
  }
};

// src/tests.ts
import { logger as logger9 } from "@elizaos/core";
var ClientBaseTestSuite = class {
  constructor() {
    this.name = "twitter-client-base";
    this.tests = [
      {
        name: "Create instance with correct configuration",
        fn: this.testInstanceCreation.bind(this)
      },
      { name: "Initialize with correct post intervals", fn: this.testPostIntervals.bind(this) }
    ];
    this.mockRuntime = {
      env: {
        TWITTER_USERNAME: "testuser",
        TWITTER_DRY_RUN: "true",
        TWITTER_POST_INTERVAL_MIN: "90",
        TWITTER_POST_INTERVAL_MAX: "180",
        TWITTER_ENABLE_ACTION_PROCESSING: "true",
        TWITTER_POST_IMMEDIATELY: "false"
      },
      getEnv: (key) => this.mockRuntime.env[key] || null,
      getSetting: (key) => this.mockRuntime.env[key] || null,
      character: {
        style: {
          all: ["Test style 1", "Test style 2"],
          post: ["Post style 1", "Post style 2"]
        }
      }
    };
    this.mockConfig = {
      TWITTER_USERNAME: "testuser",
      TWITTER_DRY_RUN: true,
      TWITTER_SPACES_ENABLE: false,
      TWITTER_TARGET_USERS: [],
      TWITTER_PASSWORD: "hashedpassword",
      TWITTER_EMAIL: "test@example.com",
      TWITTER_2FA_SECRET: "",
      TWITTER_RETRY_LIMIT: 5,
      TWITTER_POLL_INTERVAL: 120,
      TWITTER_ENABLE_POST_GENERATION: true,
      TWITTER_POST_INTERVAL_MIN: 90,
      TWITTER_POST_INTERVAL_MAX: 180,
      TWITTER_POST_IMMEDIATELY: false
    };
  }
  async testInstanceCreation() {
    const client = new ClientBase(this.mockRuntime, this.mockConfig);
    if (!client) throw new Error("ClientBase instance creation failed.");
    if (this.mockRuntime.getSetting("TWITTER_USERNAME") !== "testuser") {
      throw new Error("TWITTER_USERNAME setting mismatch.");
    }
    if (client.state.TWITTER_USERNAME !== "testuser") {
      throw new Error("Client state TWITTER_USERNAME mismatch.");
    }
    if (this.mockRuntime.getSetting("TWITTER_DRY_RUN") !== "true") {
      throw new Error("TWITTER_DRY_RUN setting mismatch.");
    }
    if (client.state.TWITTER_DRY_RUN !== true) {
      throw new Error("Client state TWITTER_DRY_RUN mismatch.");
    }
    logger9.success("ClientBase instance created with correct configuration.");
  }
  async testPostIntervals() {
    const client = new ClientBase(this.mockRuntime, this.mockConfig);
    if (this.mockRuntime.getSetting("TWITTER_POST_INTERVAL_MIN") !== "90") {
      throw new Error("TWITTER_POST_INTERVAL_MIN setting mismatch.");
    }
    if (client.state.TWITTER_POST_INTERVAL_MIN !== 90) {
      throw new Error("Client state TWITTER_POST_INTERVAL_MIN mismatch.");
    }
    if (this.mockRuntime.getSetting("TWITTER_POST_INTERVAL_MAX") !== "180") {
      throw new Error("TWITTER_POST_INTERVAL_MAX setting mismatch.");
    }
    if (client.state.TWITTER_POST_INTERVAL_MAX !== 180) {
      throw new Error("Client state TWITTER_POST_INTERVAL_MAX mismatch.");
    }
    logger9.success("ClientBase initialized with correct post intervals.");
  }
};

// src/index.ts
var TwitterClientInstance = class {
  constructor(runtime, state) {
    this.client = new ClientBase(runtime, state);
    this.post = new TwitterPostClient(this.client, runtime, state);
    this.interaction = new TwitterInteractionClient(this.client, runtime, state);
    if (runtime.getSetting("TWITTER_SPACES_ENABLE") === true) {
      this.space = new TwitterSpaceClient(this.client, runtime);
    }
    this.service = TwitterService.getInstance();
  }
};
var _TwitterService = class _TwitterService extends Service {
  constructor() {
    super(...arguments);
    this.capabilityDescription = "The agent is able to send and receive messages on twitter";
    this.clients = /* @__PURE__ */ new Map();
  }
  static getInstance() {
    if (!_TwitterService.instance) {
      _TwitterService.instance = new _TwitterService();
    }
    return _TwitterService.instance;
  }
  async createClient(runtime, clientId, state) {
    if (runtime.getSetting("TWITTER_2FA_SECRET") === null) {
      runtime.setSetting("TWITTER_2FA_SECRET", void 0, false);
    }
    try {
      const existingClient = this.getClient(clientId, runtime.agentId);
      if (existingClient) {
        logger10.info(`Twitter client already exists for ${clientId}`);
        return existingClient;
      }
      const client = new TwitterClientInstance(runtime, state);
      await client.client.init();
      if (client.space) {
        client.space.startPeriodicSpaceCheck();
      }
      if (client.post) {
        client.post.start();
      }
      if (client.interaction) {
        client.interaction.start();
      }
      this.clients.set(this.getClientKey(clientId, runtime.agentId), client);
      await this.emitServerJoinedEvent(runtime, client);
      logger10.info(`Created Twitter client for ${clientId}`);
      return client;
    } catch (error) {
      logger10.error(`Failed to create Twitter client for ${clientId}:`, error);
      throw error;
    }
  }
  /**
   * Emits a standardized WORLD_JOINED event for Twitter
   * @param runtime The agent runtime
   * @param client The Twitter client instance
   */
  async emitServerJoinedEvent(runtime, client) {
    try {
      if (!client.client.profile) {
        logger10.warn("Twitter profile not available yet, can't emit WORLD_JOINED event");
        return;
      }
      const profile = client.client.profile;
      const twitterId = profile.id;
      const username = profile.username;
      const worldId = createUniqueUuid7(runtime, twitterId);
      const world = {
        id: worldId,
        name: `${username}'s Twitter`,
        agentId: runtime.agentId,
        serverId: twitterId,
        metadata: {
          ownership: { ownerId: twitterId },
          roles: {
            [twitterId]: Role.OWNER
          },
          twitter: {
            username,
            id: twitterId
          }
        }
      };
      const homeTimelineRoomId = createUniqueUuid7(runtime, `${twitterId}-home`);
      const homeTimelineRoom = {
        id: homeTimelineRoomId,
        name: `${username}'s Timeline`,
        source: "twitter",
        type: ChannelType7.FEED,
        channelId: `${twitterId}-home`,
        serverId: twitterId,
        worldId
      };
      const mentionsRoomId = createUniqueUuid7(runtime, `${twitterId}-mentions`);
      const mentionsRoom = {
        id: mentionsRoomId,
        name: `${username}'s Mentions`,
        source: "twitter",
        type: ChannelType7.GROUP,
        channelId: `${twitterId}-mentions`,
        serverId: twitterId,
        worldId
      };
      const twitterUserId = createUniqueUuid7(runtime, twitterId);
      const twitterUser = {
        id: twitterUserId,
        names: [profile.screenName || username],
        agentId: runtime.agentId,
        metadata: {
          twitter: {
            id: twitterId,
            username,
            screenName: profile.screenName || username,
            name: profile.screenName || username
          }
        }
      };
      runtime.emitEvent(["TWITTER_WORLD_JOINED" /* WORLD_JOINED */, EventType4.WORLD_JOINED], {
        runtime,
        world,
        rooms: [homeTimelineRoom, mentionsRoom],
        users: [twitterUser],
        source: "twitter"
      });
      logger10.info(`Emitted WORLD_JOINED event for Twitter account ${username}`);
    } catch (error) {
      logger10.error("Failed to emit WORLD_JOINED event for Twitter:", error);
    }
  }
  getClient(clientId, agentId) {
    return this.clients.get(this.getClientKey(clientId, agentId));
  }
  async stopClient(clientId, agentId) {
    const key = this.getClientKey(clientId, agentId);
    const client = this.clients.get(key);
    if (client) {
      try {
        await client.service.stop();
        this.clients.delete(key);
        logger10.info(`Stopped Twitter client for ${clientId}`);
      } catch (error) {
        logger10.error(`Error stopping Twitter client for ${clientId}:`, error);
      }
    }
  }
  static async start(runtime) {
    const twitterClientManager = _TwitterService.getInstance();
    const twitterConfig = {
      TWITTER_USERNAME: runtime.getSetting("TWITTER_USERNAME") || runtime.character.settings?.TWITTER_USERNAME || runtime.character.secrets?.TWITTER_USERNAME,
      TWITTER_PASSWORD: runtime.getSetting("TWITTER_PASSWORD") || runtime.character.settings?.TWITTER_PASSWORD || runtime.character.secrets?.TWITTER_PASSWORD,
      TWITTER_EMAIL: runtime.getSetting("TWITTER_EMAIL") || runtime.character.settings?.TWITTER_EMAIL || runtime.character.secrets?.TWITTER_EMAIL,
      TWITTER_2FA_SECRET: runtime.getSetting("TWITTER_2FA_SECRET") || runtime.character.settings?.TWITTER_2FA_SECRET || runtime.character.secrets?.TWITTER_2FA_SECRET
    };
    const config = Object.fromEntries(
      Object.entries(twitterConfig).filter(([_, v]) => v !== void 0)
    );
    try {
      if (config.TWITTER_USERNAME && // Basic auth
      config.TWITTER_PASSWORD && config.TWITTER_EMAIL) {
        logger10.info("Creating default Twitter client from character settings");
        await twitterClientManager.createClient(runtime, runtime.agentId, config);
      }
    } catch (error) {
      logger10.error("Failed to create default Twitter client:", error);
    }
    return twitterClientManager;
  }
  async stop() {
    await this.stopAllClients();
  }
  async stopAllClients() {
    for (const [key, client] of this.clients.entries()) {
      try {
        await client.service.stop();
        this.clients.delete(key);
      } catch (error) {
        logger10.error(`Error stopping Twitter client ${key}:`, error);
      }
    }
  }
  getClientKey(clientId, agentId) {
    return `${clientId}-${agentId}`;
  }
};
_TwitterService.serviceType = TWITTER_SERVICE_NAME;
var TwitterService = _TwitterService;
var twitterPlugin = {
  name: TWITTER_SERVICE_NAME,
  description: "Twitter client with per-server instance management",
  services: [TwitterService],
  actions: [spaceJoin_default],
  tests: [new ClientBaseTestSuite()]
};
var index_default = twitterPlugin;
export {
  TwitterClientInstance,
  TwitterService,
  index_default as default
};
//# sourceMappingURL=index.js.map