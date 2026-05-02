const path = require('node:path');

const isPathInside = (candidatePath, rootPath) => {
  const relativePath = path.relative(rootPath, candidatePath);
  return relativePath === '' || (
    Boolean(relativePath)
    && !relativePath.startsWith('..')
    && !path.isAbsolute(relativePath)
  );
};

const resolveAppProtocolAssetPath = ({ appRoot, requestUrl, defaultFile = 'desktop.html' }) => {
  const distRoot = path.resolve(appRoot, 'dist');
  let pathname = '';

  try {
    pathname = new URL(requestUrl).pathname || '/';
  } catch {
    return null;
  }

  let decodedPath = '';
  try {
    decodedPath = decodeURIComponent(pathname === '/' ? `/${defaultFile}` : pathname);
  } catch {
    return null;
  }

  const relativePath = decodedPath.replace(/^[/\\]+/, '');
  const assetPath = path.resolve(distRoot, relativePath);
  return isPathInside(assetPath, distRoot) ? assetPath : null;
};

module.exports = {
  isPathInside,
  resolveAppProtocolAssetPath,
};
