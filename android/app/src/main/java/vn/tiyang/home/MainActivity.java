package vn.tiyang.home;

import android.app.Activity;
import android.content.Intent;
import android.content.res.AssetManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.MimeTypeMap;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.IOException;

/**
 * Home screen of the TV: the Nhà Tí Yang web interface in a full-screen WebView.
 * The live site is loaded so updates need no reinstall; when it cannot load (no internet) the copy bundled in
 * the APK's assets is shown instead, so Home is never blank. JavaScript reaches the TV through {@link TvBridge}.
 */
public class MainActivity extends Activity {
    static final String REMOTE_URL = "https://ayyastu999-crypto.github.io/nha-ti-yang-tv/";
    // An https origin for the bundled copy: the YouTube player and storage behave as on the live site.
    static final String LOCAL_HOST = "appassets.androidplatform.net";
    static final String LOCAL_URL = "https://" + LOCAL_HOST + "/index.html";

    // Sends a key the page's own handler understands into whichever document has focus (the tv-fit frame
    // when the layout is scaled). GoBack closes an open dialog and does nothing otherwise.
    static final String BACK_JS = "(function(){var d=document,f=d.getElementById('tv-fit-frame');"
            + "try{if(f&&f.contentDocument)d=f.contentDocument;}catch(e){}"
            + "var t=d.activeElement||d.body;"
            + "t.dispatchEvent(new KeyboardEvent('keydown',{key:'GoBack',bubbles:true,cancelable:true}));})()";

    private WebView web;
    private boolean showingLocal;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        web.setBackgroundColor(0xFF05070B);
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        web.addJavascriptInterface(new TvBridge(this), "TiYangTV");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new HomeClient());
        web.loadUrl(REMOTE_URL);
        web.requestFocus(View.FOCUS_DOWN);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Home pressed while already home: close any dialog, like Back.
        web.evaluateJavascript(BACK_JS, null);
    }

    @Override
    public void onBackPressed() {
        // A launcher never finishes on Back; the page decides what Back means.
        web.evaluateJavascript(BACK_JS, null);
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        web.resumeTimers();
        web.requestFocus(View.FOCUS_DOWN);
        if (showingLocal && isOnline()) {
            showingLocal = false;
            web.loadUrl(REMOTE_URL);
        }
    }

    @Override
    protected void onPause() {
        // Leaving for another app: pause the page so YouTube music and timers stop.
        web.onPause();
        web.pauseTimers();
        super.onPause();
    }

    private boolean isOnline() {
        ConnectivityManager cm = getSystemService(ConnectivityManager.class);
        NetworkInfo info = cm == null ? null : cm.getActiveNetworkInfo();
        return info != null && info.isConnected();
    }

    private class HomeClient extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri url = request.getUrl();
            if (!LOCAL_HOST.equals(url.getHost())) return null;
            String path = url.getPath() == null || url.getPath().equals("/") ? "index.html" : url.getPath().substring(1);
            AssetManager assets = getAssets();
            try {
                String ext = MimeTypeMap.getFileExtensionFromUrl(path);
                String mime = "mjs".equals(ext) || "js".equals(ext) ? "text/javascript"
                        : MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
                return new WebResourceResponse(mime == null ? "application/octet-stream" : mime, "utf-8", assets.open(path));
            } catch (IOException e) {
                return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, null);
            }
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame() && !showingLocal) {
                showingLocal = true;
                view.loadUrl(LOCAL_URL);
            }
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            if (!request.isForMainFrame()) return false;
            Uri url = request.getUrl();
            String host = url.getHost();
            if (LOCAL_HOST.equals(host) || Uri.parse(REMOTE_URL).getHost().equals(host)) return false;
            // Links to other sites (YouTube chart, credits) open in the TV's browser, never inside Home.
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, url).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            } catch (Exception ignored) {
            }
            return true;
        }
    }
}
