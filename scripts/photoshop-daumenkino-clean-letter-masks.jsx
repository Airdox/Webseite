#target photoshop

app.bringToFront();
app.displayDialogs = DialogModes.NO;

var sourceFramePath = "D:/webseeite-main/docs/agent-system/social-auto-output/daumenkino-gif-letterbeat/source-gif-frames/gif_001.png";
var outputDir = "D:/webseeite-main/docs/agent-system/social-auto-output/daumenkino-gif-letterbeat/photoshop-clean";

var letters = [
  { name: "A", left: 18, top: 128, right: 148, bottom: 352, color: "ff174d" },
  { name: "I", left: 120, top: 132, right: 232, bottom: 352, color: "ffea00" },
  { name: "R", left: 204, top: 122, right: 318, bottom: 358, color: "00e5ff" },
  { name: "D", left: 286, top: 120, right: 398, bottom: 360, color: "7cff00" },
  { name: "O", left: 364, top: 124, right: 462, bottom: 352, color: "ff3df2" },
  { name: "X", left: 432, top: 116, right: 552, bottom: 352, color: "ff8a00" }
];

function ensureFolder(path) {
  var folder = new Folder(path);
  if (!folder.exists) folder.create();
}

function hexColor(hex) {
  var color = new SolidColor();
  color.rgb.red = parseInt(hex.substring(0, 2), 16);
  color.rgb.green = parseInt(hex.substring(2, 4), 16);
  color.rgb.blue = parseInt(hex.substring(4, 6), 16);
  return color;
}

function savePng(doc, targetPath) {
  var outFile = new File(targetPath);
  var options = new ExportOptionsSaveForWeb();
  options.format = SaveDocumentType.PNG;
  options.PNG8 = false;
  options.transparency = true;
  options.interlaced = false;
  options.quality = 100;
  doc.exportDocument(outFile, ExportType.SAVEFORWEB, options);
}

function saveJson(path) {
  var file = new File(path);
  file.open("w");
  file.encoding = "UTF8";
  file.write("{\n");
  file.write("  \"schema\": \"airdox.daumenkino.clean-letter-masks.v1\",\n");
  file.write("  \"sourceFrame\": \"docs/agent-system/social-auto-output/daumenkino-gif-letterbeat/source-gif-frames/gif_001.png\",\n");
  file.write("  \"note\": \"Photoshop prepared crop workfile for clean filled letter masks. Rendering uses these boxes and generated silhouette fills to avoid black holes.\",\n");
  file.write("  \"letters\": [\n");
  for (var i = 0; i < letters.length; i += 1) {
    var l = letters[i];
    file.write("    { \"name\": \"" + l.name + "\", \"file\": \"clean-letter-" + l.name + ".png\", \"box\": [" + l.left + ", " + l.top + ", " + l.right + ", " + l.bottom + "], \"color\": \"#" + l.color + "\" }");
    file.write(i === letters.length - 1 ? "\n" : ",\n");
  }
  file.write("  ]\n");
  file.write("}\n");
  file.close();
}

function exportLetter(sourceDoc, item) {
  app.activeDocument = sourceDoc;
  sourceDoc.selection.select([
    [item.left, item.top],
    [item.right, item.top],
    [item.right, item.bottom],
    [item.left, item.bottom]
  ]);
  sourceDoc.selection.copy(true);

  var w = item.right - item.left;
  var h = item.bottom - item.top;
  var doc = app.documents.add(w, h, 72, "clean-letter-" + item.name, NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
  doc.paste();
  doc.activeLayer.name = "source crop " + item.name;
  doc.activeLayer.opacity = 32;

  var fillLayer = doc.artLayers.add();
  fillLayer.name = "solid color guide " + item.name;
  doc.selection.select([[0, 0], [w, 0], [w, h], [0, h]]);
  doc.selection.fill(hexColor(item.color), ColorBlendMode.NORMAL, 42, false);
  doc.selection.deselect();
  fillLayer.move(doc.layers[doc.layers.length - 1], ElementPlacement.PLACEBEFORE);

  savePng(doc, outputDir + "/clean-letter-" + item.name + ".png");
  doc.close(SaveOptions.DONOTSAVECHANGES);
  sourceDoc.selection.deselect();
}

function main() {
  ensureFolder(outputDir);
  var sourceFile = new File(sourceFramePath);
  if (!sourceFile.exists) {
    throw new Error("Source frame not found: " + sourceFramePath);
  }

  var doc = app.open(sourceFile);
  doc.activeLayer.name = "selected gif frame without lower-right artifact";

  for (var i = 0; i < letters.length; i += 1) {
    exportLetter(doc, letters[i]);
  }

  var psdOptions = new PhotoshopSaveOptions();
  psdOptions.layers = true;
  doc.saveAs(new File(outputDir + "/clean-letter-mask-workfile.psd"), psdOptions, true, Extension.LOWERCASE);
  saveJson(outputDir + "/manifest.json");
  doc.close(SaveOptions.DONOTSAVECHANGES);
}

main();
