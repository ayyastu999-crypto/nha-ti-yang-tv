package vn.tiyang.home;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.provider.Settings;
import android.webkit.JavascriptInterface;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;

/**
 * window.TiYangTV in the page: lets the web tiles open the real apps and the TV's own screens.
 * Every method answers false instead of throwing, so the page can fall back (Play Store, a message).
 */
class TvBridge {
    private static final String LIVE_TV_PACKAGE = "com.mediatek.wwtv.tvcenter";
    private final Activity activity;
    private final PackageManager pm;

    TvBridge(Activity activity) {
        this.activity = activity;
        this.pm = activity.getPackageManager();
    }

    @JavascriptInterface
    public boolean isInstalled(String pkg) {
        return launchIntent(pkg) != null;
    }

    @JavascriptInterface
    public boolean launchApp(String pkg) {
        return start(launchIntent(pkg));
    }

    @JavascriptInterface
    public boolean hasAppLabeled(String text) {
        return findByLabel(text) != null;
    }

    @JavascriptInterface
    public boolean launchByLabel(String text) {
        String pkg = findByLabel(text);
        return pkg != null && launchApp(pkg);
    }

    @JavascriptInterface
    public boolean openStoreSearch(String query) {
        Uri uri = Uri.parse("market://search?q=" + Uri.encode(query) + "&c=apps");
        return start(new Intent(Intent.ACTION_VIEW, uri));
    }

    @JavascriptInterface
    public boolean openInputs() {
        // The system input picker where the firmware has one, else the Live TV app (the HDMI/AV window).
        return start(new Intent("com.android.tv.action.VIEW_INPUTS")) || launchApp(LIVE_TV_PACKAGE);
    }

    @JavascriptInterface
    public boolean openTvSettings() {
        return start(new Intent(Settings.ACTION_SETTINGS));
    }

    /** The private family album packed into the APK (assets/family/album.json), or "" when this build has none. */
    @JavascriptInterface
    public String familyAlbum() {
        try (InputStream in = activity.getAssets().open("family/album.json")) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            for (int n; (n = in.read(buffer)) > 0; ) out.write(buffer, 0, n);
            return out.toString("UTF-8");
        } catch (IOException e) {
            return "";
        }
    }

    /** TV-style launch first, then a phone launcher entry, then a HOME entry (the old launcher has only that). */
    private Intent launchIntent(String pkg) {
        if (pkg == null || pkg.isEmpty() || pkg.equals(activity.getPackageName())) return null;
        Intent intent = pm.getLeanbackLaunchIntentForPackage(pkg);
        if (intent == null) intent = pm.getLaunchIntentForPackage(pkg);
        if (intent == null) {
            Intent home = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).setPackage(pkg);
            ResolveInfo info = pm.resolveActivity(home, 0);
            if (info != null && info.activityInfo != null) {
                intent = home.setClassName(pkg, info.activityInfo.name);
            }
        }
        return intent;
    }

    /** First launchable app (TV entry preferred) whose name contains the text, ignoring case. */
    private String findByLabel(String text) {
        if (text == null || text.isEmpty()) return null;
        String needle = text.toLowerCase(Locale.ROOT);
        for (String category : new String[]{Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER}) {
            List<ResolveInfo> apps = pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(category), 0);
            for (ResolveInfo app : apps) {
                String pkg = app.activityInfo.packageName;
                if (pkg.equals(activity.getPackageName())) continue;
                CharSequence label = app.loadLabel(pm);
                if (label != null && label.toString().toLowerCase(Locale.ROOT).contains(needle)) return pkg;
            }
        }
        return null;
    }

    private boolean start(Intent intent) {
        if (intent == null) return false;
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            activity.startActivity(intent);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
