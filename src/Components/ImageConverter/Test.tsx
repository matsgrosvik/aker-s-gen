import React, { useRef, useState } from "react";

// GWD-Compatible SVG → HTML Generator
// - Upload SVG
// - Extracts element IDs
// - Lets you set text for each ID
// - Exports a GWD-ready HTML snippet with data-bind attributes

export default function App() {
  const [svgText, setSvgText] = useState<string>("");
  const [svgError, setSvgError] = useState<string>("");
  const [ids, setIds] = useState<string[]>([]);
  const [textIds, setTextIds] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState<string>("my_svg");
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [downloadName, setDownloadName] = useState<string>("");
  const [exportMode, setExportMode] = useState<"plain" | "gwd">("gwd");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setSvgError("");
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name.replace(/\.svg$/i, "") || "my_svg");

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      try {
        const {
          ids: parsedIds,
          textIds: parsedTextIds,
          defaults,
        } = extractIdsAndDefaults(text);
        setSvgText(text);
        setIds(parsedIds);
        setTextIds(parsedTextIds);
        setValues(defaults);
      } catch (err: any) {
        console.error(err);
        setSvgError(
          "Couldn't parse that SVG. Make sure it's a valid SVG file."
        );
        setSvgText("");
        setIds([]);
        setTextIds([]);
        setValues({});
      }
    };
    reader.onerror = () => setSvgError("Failed to read file.");
    reader.readAsText(file);
  }

  function extractIdsAndDefaults(text: string): {
    ids: string[];
    textIds: string[];
    defaults: Record<string, string>;
  } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "image/svg+xml");
    const parserError = doc.querySelector("parsererror");
    if (parserError) throw new Error("Invalid SVG XML");

    const allWithId = Array.from(
      doc.querySelectorAll("[*|id], [id]")
    ) as Element[];
    const seen = new Set<string>();
    const idList: string[] = [];
    const tList: string[] = [];
    const defaults: Record<string, string> = {};

    for (const el of allWithId) {
      const id = el.getAttribute("id");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      idList.push(id);
      const tag = el.tagName.toLowerCase();
      const isTextish = tag === "text" || tag === "tspan" || tag === "title";
      if (isTextish) tList.push(id);
      defaults[id] = isTextish ? (el.textContent || "").trim() : "";
    }

    return { ids: idList, textIds: tList, defaults };
  }

  function updateValue(id: string, v: string) {
    setValues((prev) => ({ ...prev, [id]: v }));
  }

  function reset() {
    setSvgText("");
    setSvgError("");
    setIds([]);
    setTextIds([]);
    setValues({});
    setDownloadUrl("");
    setDownloadName("");
    setFileName("my_svg");
    fileInputRef.current && (fileInputRef.current.value = "");
  }

  function generateHtml() {
    if (!svgText) return;
    if (exportMode === "gwd") {
      generateGwdHtml();
    } else {
      generatePlainHtml();
    }
  }

  function generatePlainHtml() {
    const fieldsObject = values;
    const safeSvg = svgText
      .replace(/<\?xml[^>]*>/gi, "")
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .trim();
    const script = `
    <script>
    (function() {
      const fields = ${JSON.stringify(fieldsObject)};
      function applyFields() {
        for (const id in fields) {
          const value = fields[id];
          const el = document.getElementById(id);
          if (!el) continue;
          const tag = (el.tagName || '').toLowerCase();
          if (tag === 'text' || tag === 'tspan' || tag === 'title') {
            el.textContent = value;
          } else if (value !== undefined && value !== null) {
            el.setAttribute('data-value', String(value));
          }
        }
      }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyFields);
      } else {
        applyFields();
      }
    })();
    </script>`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>${escapeHtml(fileName)} - Generated</title>
  <style>html, body { margin: 0; padding: 0; height: 100%; } .wrap { display: grid; place-items: center; min-height: 100vh; background: #f8fafc; } svg { max-width: 90vw; max-height: 90vh; height: auto; width: auto; }</style>
</head>
<body>
  <div class=\"wrap\">
${safeSvg}
  </div>
${script}
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);
    setDownloadName(`${fileName || "my_svg"}.html`);
  }

  function generateGwdHtml() {
    // Build dynamic profile JSON using only text-capable IDs for bind-text (safer in GWD)
    const profileName =
      `SVG_Profile_${fileName.replace(/[^a-z0-9_\-]/gi, "_")}` || "SVG_Profile";
    const rowName = profileName;

    const devRow: Record<string, any> = {
      _id: 0,
      Unique_ID: "R0",
      Reporting_Label: `${profileName}_Default`,
      Campaign: "Default",
      Message: "default",
      Creative_start: { RawValue: "1/1/2025", UtcValue: 1735689600000 },
      Creative_end: { RawValue: "1/1/2028", UtcValue: 1830326400000 },
      ExitURL: { Url: "" },
      Active: true,
      Default: true,
      Audience_: false,
      bg_color: "#ffffff",
    };

    // Add a field per text id (string values)
    for (const id of textIds) {
      devRow[id] = values[id] ?? "";
    }

    // Inline SVG preparation: inject bind-text on text-ish nodes by ID
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    for (const id of textIds) {
      const el = doc.getElementById(id);
      if (el) {
        el.setAttribute("bind-text", `${rowName}.0.${id}`);
        // Optional: ensure an initial text so it's visible pre-bind
        if (!el.textContent) el.textContent = values[id] ?? "";
      }
    }
    const serializedSvg = new XMLSerializer().serializeToString(
      doc.documentElement
    );

    const gwdHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset=\"utf-8\">
  <meta name=\"generator\" content=\"Google Web Designer compatible\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
  <link href=\"gwdpage_style.css\" rel=\"stylesheet\" data-exports-type=\"gwd-page\">
  <link href=\"gwdpagedeck_style.css\" rel=\"stylesheet\" data-exports-type=\"gwd-pagedeck\">
  <link href=\"gwdgooglead_style.css\" rel=\"stylesheet\" data-exports-type=\"gwd-google-ad\">
  <style id=\"gwd-lightbox-style\">.gwd-lightbox{overflow:hidden}</style>
  <style>html,body{width:100%;height:100%;margin:0}.gwd-page-container{position:relative;width:100%;height:100%}.gwd-page-wrapper{background:#fff;position:absolute;transform:translateZ(0)}.gwd-page-size{width:300px;height:600px}.content{position:absolute;inset:0;display:grid;place-items:center}</style>
  <script src=\"gwd_webcomponents_v1_min.js\"></script>
  <script src=\"gwdpage_min.js\"></script>
  <script src=\"gwdpagedeck_min.js\"></script>
  <script src=\"https://s0.2mdn.net/ads/studio/Enabler.js\"></script>
  <script src=\"gwdgooglead_min.js\"></script>
  <script src=\"gwdgpadataprovider_min.js\"></script>
  <script src=\"gwddatabinder_min.js\"></script>
  <script src=\"gwdattached_min.js\"></script>
  <script src=\"gwdtexthelper_min.js\"></script>
  <script>
    Enabler.setProfileId(10949709);
    var devDynamicContent = {};
    devDynamicContent[${JSON.stringify(rowName)}] = [{}];
    devDynamicContent[${JSON.stringify(rowName)}][0] = ${JSON.stringify(
      devRow
    )};
    Enabler.setDevDynamicContent(devDynamicContent);
  </script>
</head>
<body>
  <gwd-gpa-data-provider id=\"gpa-data-provider\" profile-id=\"10949709\" profile-name=\"${rowName}\"></gwd-gpa-data-provider>
  <gwd-data-binder id=\"binder\"></gwd-data-binder>
  <gwd-google-ad id=\"gwd-ad\">
    <gwd-metric-configuration></gwd-metric-configuration>
    <gwd-pagedeck class=\"gwd-page-container\" id=\"deck\">
      <gwd-page id=\"page1\" class=\"gwd-page-wrapper gwd-page-size gwd-lightbox\">
        <div class=\"content\" bind-style-background-color=\"${rowName}.0.bg_color\">
${serializedSvg}
        </div>
      </gwd-page>
    </gwd-pagedeck>
  </gwd-google-ad>
  <script>
    (function(){
      var ad=document.getElementById('gwd-ad');
      function start(){ requestAnimationFrame(function(){ setTimeout(function(){ ad.initAd(); },1); }); }
      if(document.readyState==='loading'){ window.addEventListener('DOMContentLoaded', start); } else { start(); }
    })();
  </script>
</body>
</html>`;

    const blob = new Blob([gwdHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);
    setDownloadName(`${fileName || "my_svg"}_GWD.html`);
  }

  function escapeHtml(s: string) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const hasSvg = !!svgText;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="px-6 py-5 border-b bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">SVG ID Form Generator</h1>
          <p className="text-sm text-slate-600">
            Upload an SVG → edit fields by ID → export HTML. Choose
            <span className="font-semibold\">GWD</span> for Google Web Designer
            format.
          </p>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-700 flex items-center gap-2">
              <span>Export:</span>
              <select
                value={exportMode}
                onChange={(e) => setExportMode(e.target.value as any)}
                className="border rounded-xl px-2 py-1">
                <option value="gwd">GWD</option>
                <option value="plain">Plain HTML</option>
              </select>
            </label>
            <button
              onClick={reset}
              className="px-3 py-2 rounded-2xl border shadow-sm bg-white hover:bg-slate-100"
              title="Reset">
              Reset
            </button>
            <a
              href={downloadUrl || undefined}
              download={downloadName || undefined}
              className={`px-4 py-2 rounded-2xl shadow-sm text-white ${
                downloadUrl
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-slate-300 cursor-not-allowed"
              }`}>
              Download
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow p-5">
          <h2 className="text-lg font-semibold mb-3">1) Upload SVG</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,image/svg+xml"
            onChange={handleFile}
            className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
          />
          {svgError && <p className="mt-3 text-sm text-red-600">{svgError}</p>}
          {hasSvg && (
            <div className="mt-5">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Output filename
              </label>
              <input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full rounded-xl border px-3 py-2"
                placeholder="my_svg"
              />
            </div>
          )}
          {hasSvg && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">SVG Preview</h3>
              <div className="border rounded-xl p-3 bg-slate-50 overflow-auto max-h-[60vh]">
                <div dangerouslySetInnerHTML={{ __html: svgText }} />
              </div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">2) Edit fields (by ID)</h2>
            {hasSvg && (
              <button
                onClick={generateHtml}
                className="px-4 py-2 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 shadow">
                Generate {exportMode === "gwd" ? "GWD" : "HTML"}
              </button>
            )}
          </div>
          {!hasSvg && (
            <p className="text-slate-600">Upload an SVG to see its IDs here.</p>
          )}
          {hasSvg && ids.length === 0 && (
            <p className="text-slate-600">
              No elements with an <code>id</code> were found in this SVG.
            </p>
          )}
          {hasSvg && ids.length > 0 && (
            <ul className="space-y-3 max-h-[65vh] overflow-auto pr-1">
              {ids.map((id) => (
                <li key={id} className="border rounded-xl p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    ID
                  </div>
                  <div className="font-mono text-sm mb-2 break-all">{id}</div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Value
                  </label>
                  <input
                    value={values[id] ?? ""}
                    onChange={(e) => updateValue(id, e.target.value)}
                    className="w-full rounded-xl border px-3 py-2"
                    placeholder="Text for text/tspan/title; ignored for shapes in GWD export"
                  />
                </li>
              ))}
            </ul>
          )}
          {hasSvg && ids.length > 0 && (
            <div className="mt-4 text-sm text-slate-500 space-y-2">
              <p>
                <strong>GWD export:</strong> Adds <code>bind-text</code> to{" "}
                <code>&lt;text&gt;</code>/<code>&lt;tspan&gt;</code>/
                <code>&lt;title&gt;</code> nodes only. A dynamic profile is
                generated where each text ID becomes a profile field.
              </p>
              <p>
                You'll need to upload the referenced GWD runtime assets (
                <code>gwd*_min.js</code>, CSS) in Studio/CM/DV360 or adjust
                paths to match your template.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-6 pb-10 text-sm text-slate-500">
        <div className="mt-6">
          Tip: Add IDs to any text you want dynamic in GWD (e.g.,{" "}
          <code>&lt;text id=\"headline\"&gt;Hello&lt;/text&gt;</code>). Non-text
          elements are not auto-bound in GWD export.
        </div>
      </footer>
    </div>
  );
}
