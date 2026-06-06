#target photoshop

app.bringToFront();
app.displayDialogs = DialogModes.NO;

var sourcePath = "D:/webseeite-main/docs/agent-system/visual-templates/social/social-auto-output/daumenkino-preview/mixed-graffiti-portrait/portrait-source.png";
var outputPath = "D:/webseeite-main/docs/agent-system/visual-templates/social/social-auto-output/daumenkino-preview/mixed-graffiti-portrait/portrait-cutout.png";

function selectSubject() {
  var desc = new ActionDescriptor();
  desc.putBoolean(stringIDToTypeID("sampleAllLayers"), false);
  executeAction(stringIDToTypeID("autoCutout"), desc, DialogModes.NO);
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

  var doc = app.open(sourceFile);
  doc.activeLayer = doc.layers[0];
  if (doc.activeLayer.isBackgroundLayer) {
    doc.activeLayer.isBackgroundLayer = false;
  }

  selectSubject();
  doc.selection.feather(1.2);
  doc.selection.expand(1);
  makeMaskFromSelection();
  exportTransparentPng(doc, outputPath);

  doc.close(SaveOptions.DONOTSAVECHANGES);
  alert("AIRDOX portrait cutout exported:\n" + outputPath);
}

main();
