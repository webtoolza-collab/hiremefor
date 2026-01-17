const fs = require('fs');
// Simple 10x10 red PNG
const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADq/5r4FxAAAAAElFTkSuQmCC';
fs.writeFileSync('test-image.png', Buffer.from(base64, 'base64'));
console.log('Created test-image.png');
