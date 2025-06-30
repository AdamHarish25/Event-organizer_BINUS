import getAccessToken from "./getAccessToken.js";
import getRefreshToken from "./getRefreshToken.js";

export default function getToken(payload) {
    return {
        accessToken: getAccessToken(payload),
        refreshToken: getRefreshToken(payload),
    };
}
