const sharp = require('sharp');
const path = require('path');

async function padImage() {
  const input = path.join(__dirname, 'assets', 'Img', 'logo.png');
  const output = path.join(__dirname, 'assets', 'Img', 'logo_padded.png');
  
  try {
    await sharp(input)
      .resize(600, 600, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: 212,
        bottom: 212,
        left: 212,
        right: 212,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(output);
      
    console.log('Padded image generated successfully at ' + output);
  } catch (error) {
    console.error('Error generating padded image:', error);
  }
}

padImage();
