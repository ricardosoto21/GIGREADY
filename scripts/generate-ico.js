const pngToIco = require('png-to-ico');
const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

const input = path.join(__dirname, '../assets/icon.png');
const output = path.join(__dirname, '../assets/icon.ico');

async function run() {
  try {
    if (!fs.existsSync(input)) {
      throw new Error(`No se encontró el archivo ${input}`);
    }

    console.log('Reading image with Jimp...');
    const image = await Jimp.read(input);
    
    console.log('Converting to PNG buffer...');
    const pngBuffer = await image.getBuffer('image/png');
    
    console.log('Generating ICO...');
    const icoBuffer = await pngToIco(pngBuffer);
    
    fs.writeFileSync(output, icoBuffer);
    console.log('✅ Icono generado correctamente en assets/icon.ico');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
