#target photoshop

app.bringToFront();
app.displayDialogs = DialogModes.NO;

var ROOT = "D:/webseeite-main";
var outputDir = ROOT + "/public/brand-assets/airdox-lettering/strobe-proof";
var sourcePath = outputDir + "/source-separated-airdox.png";
var logPath = outputDir + "/photoshop-separated-letter-mask.log";

var crops = [
  { name: "letter-a", label: "A", left: 55, top: 135, width: 465, height: 530 },
  { name: "letter-i", label: "i", left: 510, top: 200, width: 160, height: 430 },
  { name: "letter-r", label: "R", left: 675, top: 210, width: 290, height: 420 },
  { name: "letter-d", label: "D", left: 975, top: 210, width: 260, height: 420 },
  {
    name: "letter-o",
    label: "O",
    left: 1210,
    top: 210,
    width: 330,
    height: 455,
    keep: [
      [64, 190],
      [76, 112],
      [128, 46],
      [212, 34],
      [267, 76],
      [286, 156],
      [278, 254],
      [245, 363],
      [176, 426],
      [88, 405],
      [34, 326],
      [28, 244]
    ]
  },
  {
    name: "letter-x",
    label: "X",
    left: 1460,
    top: 150,
    width: 449,
    height: 580,
    keep: [
      [36, 120],
      [124, 76],
      [220, 204],
      [308, 112],
      [434, 42],
      [420, 152],
      [292, 300],
      [430, 510],
      [326, 548],
      [222, 394],
      [115, 560],
      [14, 506],
      [146, 300]
    ]
  }
];

function ensureFolder(path) {
  var folder = new Folder(path);
  if (!folder.exists) folder.create();
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
  file.write(String(new Date()) + " " + text + "\n");
  file.close();
}

function whiteColor() {
  var c = new SolidColor();
  c.rgb.red = 255;
  c.rgb.green = 255;
  c.rgb.blue = 255;
  return c;
}

function blackColor() {
  var c = new SolidColor();
  c.rgb.red = 0;
  c.rgb.green = 0;
  c.rgb.blue = 0;
  return c;
}

function savePng(doc, targetPath) {
  var options = new ExportOptionsSaveForWeb();
  options.format = SaveDocumentType.PNG;
  options.PNG8 = false;
  options.transparency = true;
  options.interlaced = false;
  options.quality = 100;
  doc.exportDocument(new File(targetPath), ExportType.SAVEFORWEB, options);
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

function makeLayerMaskFromSelection() {
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  desc.putClass(charIDToTypeID("Nw  "), charIDToTypeID("Chnl"));
  ref.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Msk "));
  desc.putReference(charIDToTypeID("At  "), ref);
  desc.putEnumerated(charIDToTypeID("Usng"), charIDToTypeID("UsrM"), charIDToTypeID("RvlS"));
  executeAction(charIDToTypeID("Mk  "), desc, DialogModes.NO);
}

function safeDeselect(doc) {
  try {
    doc.selection.deselect();
  } catch (e) {}
}

function clearRegions(doc, crop) {
  if (!crop.clear) return;

  app.activeDocument = doc;
  for (var i = 0; i < crop.clear.length; i += 1) {
    var region = crop.clear[i];
    doc.selection.select([
      [region.x, region.y],
      [region.x + region.width, region.y],
      [region.x + region.width, region.y + region.height],
      [region.x, region.y + region.height]
    ]);
    doc.selection.fill(blackColor(), ColorBlendMode.NORMAL, 100, false);
  }
  safeDeselect(doc);
}

function keepSelection(doc, crop) {
  if (!crop.keep) return;

  app.activeDocument = doc;
  doc.selection.select(crop.keep);
  doc.selection.invert();
  doc.selection.fill(blackColor(), ColorBlendMode.NORMAL, 100, false);
  safeDeselect(doc);
}

function copyCrop(sourceDoc, crop) {
  app.activeDocument = sourceDoc;
  sourceDoc.selection.select([
    [crop.left, crop.top],
    [crop.left + crop.width, crop.top],
    [crop.left + crop.width, crop.top + crop.height],
    [crop.left, crop.top + crop.height]
  ]);
  sourceDoc.selection.copy();
  safeDeselect(sourceDoc);
}

function exportCrop(sourceDoc, crop) {
  copyCrop(sourceDoc, crop);

  var doc = app.documents.add(crop.width, crop.height, 72, crop.name, NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
  doc.paste();
  doc.activeLayer.name = crop.name + " chrome";
  keepSelection(doc, crop);
  clearRegions(doc, crop);

  loadCompositeLuminositySelection();
  try {
    doc.selection.expand(1);
    doc.selection.feather(0.35);
  } catch (e) {}
  makeLayerMaskFromSelection();
  savePng(doc, outputDir + "/" + crop.name + ".png");

  var maskDoc = app.documents.add(crop.width, crop.height, 72, crop.name + "-solid", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
  copyCrop(sourceDoc, crop);
  app.activeDocument = maskDoc;
  maskDoc.paste();
  keepSelection(maskDoc, crop);
  clearRegions(maskDoc, crop);
  loadCompositeLuminositySelection();
  try {
    maskDoc.selection.expand(1);
    maskDoc.selection.feather(0.35);
  } catch (e2) {}
  maskDoc.activeLayer.visible = false;
  var fillLayer = maskDoc.artLayers.add();
  fillLayer.name = crop.name + " solid";
  maskDoc.selection.fill(whiteColor(), ColorBlendMode.NORMAL, 100, false);
  maskDoc.selection.deselect();
  savePng(maskDoc, outputDir + "/" + crop.name + "-solid.png");

  maskDoc.close(SaveOptions.DONOTSAVECHANGES);
  doc.close(SaveOptions.DONOTSAVECHANGES);
}

function writeManifest() {
  var text = "{\n";
  text += "  \"schema\": \"airdox.photoshop.separated-letter-masks.v1\",\n";
  text += "  \"source\": \"source-separated-airdox.png\",\n";
  text += "  \"note\": \"Generated by Photoshop from isolated AIRDOX source; O/X neighbor fragments are cleared before mask creation.\",\n";
  text += "  \"crops\": [\n";
  for (var i = 0; i < crops.length; i += 1) {
    var c = crops[i];
    text += "    { \"name\": \"" + c.name + "\", \"label\": \"" + c.label + "\", \"left\": " + c.left + ", \"top\": " + c.top + ", \"width\": " + c.width + ", \"height\": " + c.height + " }";
    text += i === crops.length - 1 ? "\n" : ",\n";
  }
  text += "  ]\n";
  text += "}\n";
  writeFile(outputDir + "/photoshop-separated-letter-mask-manifest.json", text);
}

function main() {
  appendLog("start");
  ensureFolder(outputDir);

  var sourceFile = new File(sourcePath);
  if (!sourceFile.exists) throw new Error("Source not found: " + sourcePath);

  var sourceDoc = app.open(sourceFile);
  for (var i = 0; i < crops.length; i += 1) {
    exportCrop(sourceDoc, crops[i]);
    appendLog("exported " + crops[i].name);
  }
  writeManifest();
  writeFile(outputDir + "/photoshop-separated-letter-mask.done", "done\n");
  sourceDoc.close(SaveOptions.DONOTSAVECHANGES);
  appendLog("done");
}

try {
  main();
} catch (e) {
  try {
    appendLog("error: " + e.toString());
  } catch (logError) {}
  try {
    ensureFolder(outputDir);
    writeFile(outputDir + "/photoshop-separated-letter-mask.error.txt", e.toString() + "\n");
  } catch (writeError) {}
  throw e;
}
