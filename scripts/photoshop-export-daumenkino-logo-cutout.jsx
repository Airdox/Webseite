#target photoshop

app.bringToFront();
app.displayDialogs = DialogModes.NO;

var sourcePath = "D:/webseeite-main/scratch/daumenkino-contact/tile_002.jpg";
var outputPath = "D:/webseeite-main/docs/agent-system/visual-templates/social/social-auto-output/daumenkino-preview/sissygut-design-prototypes/airdox-wildstyle-cutout.png";

function ensureFolder(path) {
  var folder = new Folder(path);
  if (!folder.exists) folder.create();
}

function unlockLayer(layer) {
  try {
    if (layer.isBackgroundLayer) layer.isBackgroundLayer = false;
  } catch (e) {}
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

function exportTransparentPng(doc, targetPath) {
  var outFile = new File(targetPath);
  var options = new ExportOptionsSaveForWeb();
  options.format = SaveDocumentType.PNG;
  options.PNG8 = false;
  options.transparency = true;
  options.interlaced = false;
  options.quality = 100;
  doc.exportDocument(outFile, ExportType.SAVEFORWEB, options);
}

function main() {
  var sourceFile = new File(sourcePath);
  if (!sourceFile.exists) {
    alert("Source not found:\n" + sourcePath);
    return;
  }

  ensureFolder("D:/webseeite-main/docs/agent-system/visual-templates/social/social-auto-output/daumenkino-preview/sissygut-design-prototypes");

  var doc = app.open(sourceFile);
  doc.activeLayer = doc.layers[0];
  unlockLayer(doc.activeLayer);

  loadCompositeLuminositySelection();
  doc.selection.feather(0.7);
  doc.selection.expand(1);
  makeMaskFromSelection();
  exportTransparentPng(doc, outputPath);

  doc.close(SaveOptions.DONOTSAVECHANGES);
  alert("AIRDOX wildstyle cutout exported:\n" + outputPath);
}

main();
