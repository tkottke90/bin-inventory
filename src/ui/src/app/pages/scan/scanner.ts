import { html } from 'lit-html';
import { query } from 'lit-element'
import styles from './scanner.module.css';

// == Types ==
import { PageComponent } from '../../components/page-component';
// ===========

// == Services ==

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
    
      requestAnimationFrame(this.videoTick(canvas, video));
    }
  }

  private async scanImage($event: Event) {
    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
  
    var ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  
    ctx.drawImage(this.videoElement, 0, 0, this.videoElement.videoWidth, this.videoElement.videoHeight)
    var dataURI = canvas.toDataURL('image/png');
  }
}

customElements.define(tag, ScannerPage);

export {
  ScannerPage,
  tag
};