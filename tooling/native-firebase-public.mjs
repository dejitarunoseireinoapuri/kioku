const allowed = new Set([
    "CLIENT_ID",
    "REVERSED_CLIENT_ID",
    "ANDROID_CLIENT_ID",
    "API_KEY",
    "GCM_SENDER_ID",
    "PLIST_VERSION",
    "BUNDLE_ID",
    "PROJECT_ID",
    "STORAGE_BUCKET",
    "GOOGLE_APP_ID",
    "IS_ADS_ENABLED",
    "IS_ANALYTICS_ENABLED",
    "IS_APPINVITE_ENABLED",
    "IS_GCM_ENABLED",
    "IS_SIGNIN_ENABLED",
    "DATABASE_URL",
]);

export function validateNativeFirebase(data) {
    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data) ||
        !Object.keys(data).every((key) => allowed.has(key)) ||
        data.PROJECT_ID !== "kioku-9454f" ||
        data.BUNDLE_ID !== "io.github.dejitarunoseireinoapuri.kioku" ||
        !/^AIza[A-Za-z0-9_-]{35}$/.test(data.API_KEY ?? "") ||
        !Object.values(data).every(
            (value) =>
                ["string", "boolean"].includes(typeof value) &&
                !/sk-(?:proj-)?[A-Za-z0-9_-]{20,}/.test(String(value)),
        )
    ) {
        throw new Error(
            "Native Firebase configuration rejected; values omitted.",
        );
    }
    return data;
}
