import { html } from 'lit-html';
import { query } from 'lit-element'
import styles from './scanner.module.css';
import { wrap } from 'comlink';

// == Types ==
import { PageComponent } from '../../components/page-component';
// ===========

// == Services ==
import { WorkerService } from '../../services/worker.service';
// ==============

// == Components ==

// ================

const tag = 'scanner-page';

class ScannerPage extends PageComponent {

  @query('video')
  private videoElement!: HTMLVideoElement;

  @query('canvas')
  private canvasElement!: HTMLCanvasElement;

  private hasVideo = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  private videoConstraints = {
    video: {
      facingMode: 'environment'
    },
    audio: false
  };
  private videoLoop: number = 0;
  private videoStream!: MediaStream;

  private worker: any;

  firstUpdated() {
    const worker = new Worker('/assets/scanner.worker.js');
    this.worker = wrap(worker);

  //   console.log('Calling ping');
  //   const call = api.logSomething()
   
  //   console.dir(call);
  //   call.then((response: any) => {
  //     console.log('Response');
  //     console.dir(response)
  //   })
  //   .catch((err: any) => console.error)
  //   .finally(() => console.log('done'));

    
  }

  connectedCallback() {
    super.connectedCallback();
  }

  onActivated() {
    if (!this.videoStream && this.hasVideo) {
      navigator.mediaDevices
        .getUserMedia(this.videoConstraints)
        .catch((error) => {
          console.error(error);
        })
        .then((videoStream) => {
          if (!videoStream) {
            console.error('Error in video stream')
            console.dir(videoStream); 
            return;
          }

          this.videoElement.srcObject = videoStream;
          this.videoElement.setAttribute('autoplay', '');
          this.videoElement.setAttribute('hidden', '');

          this.videoLoop = requestAnimationFrame(this.videoTick(this.canvasElement, this.videoElement));
        })
    }
  }

  render() {
    return html`
      <div class="${styles.container}">
        <video></video>
        <canvas></canvas>
      </div>
    `
  }

  // Video 
  private videoTick(canvas: HTMLCanvasElement, video: HTMLVideoElement) {
    return async () => {
      if (!video) {
        return;
      }
      
      const canvasContext = canvas.getContext('2d') as CanvasRenderingContext2D;
    
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
    
      canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
    
      await this.scanImage();

      requestAnimationFrame(this.videoTick(canvas, video));
    }
  }

  private async scanImage() {
    // const canvas = this.canvasElement;
    // canvas.width = this.videoElement.videoWidth;
    // canvas.height = this.videoElement.videoHeight;
  
    var ctx = this.canvasElement.getContext('2d') as CanvasRenderingContext2D;
  
    ctx.drawImage(this.videoElement, 0, 0, this.videoElement.videoWidth, this.videoElement.videoHeight)
    var imageData = ctx.getImageData(0, 0, this.videoElement.width, this.videoElement.height);

    const grayData = [];
    const data = imageData.data;
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      grayData[j] = (data[i] * 66 + data[i + 1] * 129 + data[i + 2]* 25 + 4096) >> 8;
    }

    const p = await this.worker.createImageBuffer(this.videoElement.width, this.videoElement.height);
    await this.worker.HEAP8.set(grayData, p);

    this.worker.scanImage(p, this.videoElement.width, this.videoElement.height);

    this.worker.destroyImageBuffer(p);

  }
}

customElements.define(tag, ScannerPage);

export {
  ScannerPage,
  tag
};