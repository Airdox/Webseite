#target photoshop

app.bringToFront();
app.displayDialogs = DialogModes.NO;

var ROOT = "D:/webseeite-main";
var sourcePath = "C:/Users/p_kro/.codex/generated_images/019e8714-5ffb-7211-a366-0ed865c06d89/ig_053cfc4d25a80922016a1edf0ebe9c8191ade9777ad1bff752.png";
var outputDir = ROOT + "/public/brand-assets/airdox-lettering/strobe-proof";
var logPath = outputDir + "/photoshop-letter-mask.log";

var letters = [
  { name: "a", label: "A", left: 48, top: 70, right: 293, bottom: 320 },
  { name: "i", label: "i", left: 220, top: 72, right: 348, bottom: 287 },
  { name: "r", label: "r", left: 300, top: 108, right: 510, bottom: 308 },
  { name: "d", label: "d", left: 445, top: 108, right: 615, bottom: 290 },
  { name: "o", label: "o", left: 565, top: 112, right: 690, bottom: 272 },
  { name: "x", label: "x", left: 622, top: 96, right: 777, bottom: 296 }
];

var wordmark = { name: "wordmark-02", left: 45, top: 55, right: 765, bottom: 355 };

function ensureFolder(path) {
  var folder = new Folder(path);
  if (!folder.exists) folder.create();
}

function unlockLayer(layer) {
  try {
    if (layer.isBackgroundLayer) layer.isBackgroundLayer = false;
  } catch (e) {}
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

function writeFile(path, text) {
  var file = new File(path);
  file.encoding = "UTF8";
  file.open("w");
  file.write(text);
  file.close();
}

function appendLog(text) {
  ensureFolder(outputDir);
  var file = new File(logPath);
  file.encoding = "UTF8";
  file.open(file.exists ? "a" : "w");
  file.write(new Date().toISOString() + " " + text + "\n");
  file.close();
}

function color(hex) {
  var c = new SolidColor();
  c.rgb.red = parseInt(hex.substr(0, 2), 16);
  c.rgb.green = parseInt(hex.substr(2, 2), 16);
  c.rgb.blue = parseInt(hex.substr(4, 2), 16);
  return c;
}

function loadCompositeLuminositySelection() {
  var desc = new ActionDescriptor();
  var selectionRef = new ActionReference();
  selectionRef.putProperty(charIDToTypeID("Chnl"), charIDToTypeID("fsel"));
  desc.putReference(charIDToTypeID("null"), selectionRef);

  var channelRef = new ActionReference();
  channelRef.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("RGB "));
  desc.putReference(charIDToTypeID("T   "), channelRef);
  executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
}

function makeMaskFromSelection() {
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  desc.putClass(charIDToTypeID("Nw  "), charIDToTypeID("Chnl"));
  ref.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Msk "));
  desc.putReference(charIDToTypeID("At  "), ref);
  desc.putEnumerated(charIDToTypeID("Usng"), charIDToTypeID("UsrM"), charIDToTypeID("RvlS"));
  executeAction(charIDToTypeID("Mk  "), desc, DialogModes.NO);
}

function selectCrop(sourceDoc, item) {
  app.activeDocument = sourceDoc;
  sourceDoc.selection.select([
    [item.left, item.top],
    [item.right, item.top],
    [item.right, item.bottom],
    [item.left, item.bottom]
  ]);
  sourceDoc.selection.copy(true);
}

function exportCropWithPhotoshopMask(sourceDoc, item, targetPath, solidMaskPath) {
  selectCrop(sourceDoc, item);

  var width = item.right - item.left;
  var height = item.bottom - item.top;
  var doc = app.documents.add(width, height, 72, item.name, NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
  doc.paste();
  doc.activeLayer.name = item.name + " chrome source";
  unlockLayer(doc.activeLayer);

  doc.selection.select([[0, 0], [width, 0], [width, height], [0, height]]);
  doc.selection.copy(true);

  loadCompositeLuminositySelection();
  try {
    doc.selection.feather(0.45);
    doc.selection.expand(1);
  } catch (e) {}
  makeMaskFromSelection();
  savePng(doc, targetPath);

  var maskDoc = app.documents.add(width, height, 72, item.name + " solid mask", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
  app.activeDocument = maskDoc;
  maskDoc.paste();
  maskDoc.activeLayer.name = item.name + " source for solid mask";
  loadCompositeLuminositySelection();
  try {
    maskDoc.selection.feather(0.45);
    maskDoc.selection.expand(1);
  } catch (e2) {}
  maskDoc.activeLayer.remove();
  var fillLayer = maskDoc.artLayers.add();
  fillLayer.name = item.name + " solid white mask";
  maskDoc.selection.fill(color("ffffff"), ColorBlendMode.NORMAL, 100, false);
  maskDoc.selection.deselect();
  savePng(maskDoc, solidMaskPath);
  maskDoc.close(SaveOptions.DONOTSAVECHANGES);

  doc.close(SaveOptions.DONOTSAVECHANGES);
  app.activeDocument = sourceDoc;
  sourceDoc.selection.deselect();
}

function saveManifest() {
  var text = "{\n";
  text += "  \"schema\": \"airdox.photoshop.letter-masks.v1\",\n";
  text += "  \"source\": \"" + sourcePath.replace(/\\/g, "/") + "\",\n";
  text += "  \"variant\": \"01A\",\n";
  text += "  \"note\": \"Generated by Photoshop JSX. Outputs replace the sharp fallback for Remotion strobe/color-hit masks.\",\n";
  text += "  \"bpm\": 132,\n";
  text += "  \"letters\": [\n";
  for (var i = 0; i < letters.length; i += 1) {
    var l = letters[i];
    text += "    { \"name\": \"" + l.name + "\", \"label\": \"" + l.label + "\", \"file\": \"letter-" + l.name + ".png\", \"solidMask\": \"letter-" + l.name + "-solid.png\", \"box\": [" + l.left + ", " + l.top + ", " + l.right + ", " + l.bottom + "] }";
    text += i === letters.length - 1 ? "\n" : ",\n";
  }
  text += "  ]\n";
  text += "}\n";
  writeFile(outputDir + "/photoshop-letter-mask-manifest.json", text);
}

function main() {
  appendLog("start");
  ensureFolder(outputDir);

  var sourceFile = new File(sourcePath);
  if (!sourceFile.exists) {
    throw new Error("Source not found: " + sourcePath);
  }

  var sourceDoc = app.open(sourceFile);
  appendLog("opened source");
  unlockLayer(sourceDoc.layers[0]);
  sourceDoc.activeLayer.name = "AIRDOX 01A source sheet";

  savePng(sourceDoc, outputDir + "/source-sheet-photoshop.png");
  appendLog("saved source-sheet-photoshop.png");
  exportCropWithPhotoshopMask(sourceDoc, wordmark, outputDir + "/wordmark-02.png", outputDir + "/wordmark-02-solid.png");
  appendLog("exported wordmark");

  for (var i = 0; i < letters.length; i += 1) {
    exportCropWithPhotoshopMask(sourceDoc, letters[i], outputDir + "/letter-" + letters[i].name + ".png", outputDir + "/letter-" + letters[i].name + "-solid.png");
    appendLog("exported letter " + letters[i].name);
  }

  var psdOptions = new PhotoshopSaveOptions();
  psdOptions.layers = true;
  sourceDoc.saveAs(new File(outputDir + "/airdox-01a-letter-mask-workfile.psd"), psdOptions, true, Extension.LOWERCASE);
  saveManifest();
  writeFile(outputDir + "/photoshop-letter-mask.done", "photoshop letter mask export complete\n");
  appendLog("done");

  sourceDoc.close(SaveOptions.DONOTSAVECHANGES);
}

try {
  main();
} catch (e) {
  appendLog("error: " + e.toString());
  writeFile(outputDir + "/photoshop-letter-mask.error.txt", e.toString() + "\n");
  throw e;
}
