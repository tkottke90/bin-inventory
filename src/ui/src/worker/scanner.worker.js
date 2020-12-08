// import { expose } from 'comlink';
// import { expose } from 'comlink';
// import { cwrap } from '/assets/zbar.js';

importScripts('https://unpkg.com/comlink@alpha/dist/umd/comlink.js');
importScripts('./zbar.js');

console.dir(self)

const api = {
	scan_image: Module.cwrap('scan_image', '', ['number', 'number', 'number']),
	create_buffer: Module.cwrap('create_buffer', 'number', ['number', 'number']),
	destroy_buffer: Module.cwrap('destroy_buffer', '', ['number']),
};

Module['processResult'] = (symbol, data, polygon) => {
	console.log("Data liberated from WASM heap:")
	console.log(symbol)
	console.log(data)
	console.log(polygon)

	// draw the bounding polygon
	// drawPoly(ctx, polygon)

	// render the data at the first coordinate of the polygon
	// renderData(ctx, data, polygon[0], polygon[1] - 10)
}


class ScannerWorker {
	createImageBuffer = api.create_buffer;
	destroyImageBuffer = api.destroy_buffer;

	HEAP8 = Module.HEAP8;


	/**
	 * Pass image array buffer to zbar to scan
	 * @param {ArrayBuffer} buffer 
	 * @param {Number} height 
	 * @param {Number} width 
	 */
	scanImage(buffer, height, width) {
		return api.scan_image(buffer, height, width)
	}

	ping() {
		return 'pong';
	}
}

Comlink.expose(ScannerWorker);

