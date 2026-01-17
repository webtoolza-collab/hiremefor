const fs = require('fs');
fs.copyFileSync('frontend/node_modules/serve-index/public/icons/image.png', 'valid-test-image.png');
console.log('Copied valid-test-image.png successfully');
